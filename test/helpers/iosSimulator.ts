import {execFile} from 'node:child_process'
import {promisify} from 'node:util'

import {defineBrowserProvider} from '@vitest/browser'
import type {BrowserProvider, TestProject} from 'vitest/node'

const exec = promisify(execFile)

declare module 'vitest/node' {
  // `browser.instances[].browser` is typed from the union every installed provider contributes.
  // `@vitest/browser-playwright` narrows it to its own three engines, so without this the iOS
  // config cannot name the one browser this provider can open.
  interface _BrowserNames {
    iosSimulator: 'safari'
  }
}

const SAFARI_BUNDLE_ID = 'com.apple.mobilesafari'

/**
 * How many times to ask the simulator to open the tester URL.
 *
 * `simctl openurl` has to hand the URL to Safari and wait for it to accept it, and it gives up
 * after about ten seconds - which a slow runner can exceed just launching the app, failing with
 * `NSPOSIXErrorDomain code 60` ("Operation timed out") on a device that is perfectly healthy.
 * Safari is launched up front to keep that cost out of the way, so a retry only has to cover the
 * case where it still lost the race.
 */
const OPEN_URL_ATTEMPTS = 3

export interface SimulatorDevice {
  udid: string
  name: string
  state: string
  isAvailable?: boolean
  /** Human-readable runtime version, eg `iOS 18.6`, for the log line. */
  runtime: string
  /** Runtime version as a sortable number, so the newest installed iOS is picked first. */
  sortKey: number
}

export interface IosSimulatorOptions {
  /**
   * Device to run on, eg `iPhone 16`, as named by `xcrun simctl list devices`. Defaults to
   * `$IOS_SIMULATOR_DEVICE`, and failing that to an iPhone on the newest installed iOS runtime -
   * which runtimes and devices are installed differs between machines and between CI runner
   * images, so pinning a name here means the run only works where that exact device exists.
   */
  device?: string
}

/**
 * Runs the browser suite in Safari on an iOS simulator.
 *
 * The simulator shares the host's network stack, so the tester page reaches Vitest's Vite server
 * (and the test endpoints it mounts) on the same `127.0.0.1` address the other browsers use - no
 * tunnelling, and the same-origin arrangement the suite depends on still holds.
 *
 * Automation is `simctl` only, deliberately: nothing in the suite drives the page, it only loads
 * it and reports back over the websocket Vitest already opens, so `openurl` is the entire
 * integration and no WebDriver/Appium stack is needed.
 */
export function iosSimulator(options: IosSimulatorOptions = {}) {
  return defineBrowserProvider({
    name: 'ios-simulator',
    providerFactory: (project) => new IosSimulatorProvider(project, options),
  })
}

class IosSimulatorProvider implements BrowserProvider {
  name = 'ios-simulator'
  supportsParallelism = false

  private project: TestProject
  private device: string | undefined
  private booted: SimulatorDevice | undefined

  constructor(project: TestProject, options: IosSimulatorOptions) {
    this.project = project
    this.device = options.device ?? process.env['IOS_SIMULATOR_DEVICE']
  }

  getCommandsContext(): Record<string, unknown> {
    return {}
  }

  async openPage(_sessionId: string, url: string): Promise<void> {
    const device = await this.boot()
    this.project.vitest.logger.log(
      `Opening ${url} in Safari on ${device.name}, ${device.runtime} (${device.udid})`,
    )

    for (let attempt = 1; ; attempt++) {
      try {
        await exec('xcrun', ['simctl', 'openurl', device.udid, url])
        return
      } catch (err) {
        if (attempt >= OPEN_URL_ATTEMPTS) throw err
        this.project.vitest.logger.log(
          `Opening it failed (attempt ${attempt} of ${OPEN_URL_ATTEMPTS}), restarting Safari and retrying: ${
            err instanceof Error ? err.message.split('\n')[0] : err
          }`,
        )
        // Restart Safari rather than just asking again: a timed-out `openurl` may still have
        // navigated, and a second tester page would then connect under the same session id.
        await terminateSafari(device.udid)
        await launchSafari(device.udid)
      }
    }
  }

  async close(): Promise<void> {
    if (!this.booted) return
    // Leave the simulator booted - booting costs the better part of a minute, and a developer
    // running the suite repeatedly should not pay it every time - but close Safari, so the next
    // run starts on a blank page instead of restoring the previous tester page.
    await terminateSafari(this.booted.udid)
  }

  private async boot(): Promise<SimulatorDevice> {
    this.booted ??= await bootSimulator(this.device)
    return this.booted
  }
}

/**
 * Boots a simulator to run on, and resolves once it has finished starting up.
 *
 * Also used by `scripts/bootIosSimulator.ts`, which CI runs as a step of its own: a cold boot
 * takes longer than `browser.connectTimeout` allows for, and booting up front keeps that wait
 * out of the window Vitest gives the browser to connect back (and, incidentally, makes the boot
 * a visible, separately timed step in the log rather than a silent stall).
 */
export async function bootSimulator(name?: string | undefined): Promise<SimulatorDevice> {
  const {stdout} = await exec('xcrun', ['simctl', 'list', 'devices', 'available', '--json'])
  const device = pickDevice(listDevices(stdout), name)
  if (!device) {
    throw new Error(
      `Found no available iOS simulator ${name ? `named "${name}"` : 'to run on'}. ` +
        `\`xcrun simctl list devices available\` lists what is installed; ` +
        `\`xcodebuild -downloadPlatform iOS\` installs a runtime if none is.`,
    )
  }

  if (device.state !== 'Booted') {
    // `bootstatus -b` boots the device and waits until it has finished starting up, so the first
    // `openurl` does not race the boot. The simulator does not need Simulator.app to be open in
    // order to run Safari, so nothing here brings up a UI.
    await exec('xcrun', ['simctl', 'bootstatus', device.udid, '-b'], {timeout: 600_000})
  }

  // Start Safari here rather than leaving its first launch to `openurl`, which times out after
  // about ten seconds - on a cold simulator that is not enough for the app to come up. Launching
  // it up front pays that cost where nothing is racing a timeout.
  await launchSafari(device.udid)

  return device
}

function launchSafari(udid: string): Promise<unknown> {
  // Best-effort: if Safari is already running this reports an error, and if the launch itself
  // times out the retry in `openPage` is what covers it. Either way the run should carry on.
  return exec('xcrun', ['simctl', 'launch', udid, SAFARI_BUNDLE_ID], {timeout: 120_000}).catch(
    () => undefined,
  )
}

function terminateSafari(udid: string): Promise<unknown> {
  // Reports an error when Safari is not running, which is not worth distinguishing here.
  return exec('xcrun', ['simctl', 'terminate', udid, SAFARI_BUNDLE_ID], {timeout: 120_000}).catch(
    () => undefined,
  )
}

/**
 * Flattens `simctl list devices --json` into iOS devices, newest runtime first. The JSON keys the
 * device lists by runtime identifier, eg `com.apple.CoreSimulator.SimRuntime.iOS-18-6`; anything
 * that is not an iOS runtime (watchOS, tvOS, visionOS) is dropped.
 */
function listDevices(json: string): SimulatorDevice[] {
  const parsed: unknown = JSON.parse(json)
  if (typeof parsed !== 'object' || parsed === null || !('devices' in parsed)) return []
  const {devices} = parsed
  if (typeof devices !== 'object' || devices === null) return []

  const found: SimulatorDevice[] = []
  for (const [runtime, list] of Object.entries(devices)) {
    const version = /SimRuntime\.iOS-(\d+)-(\d+)/.exec(runtime)
    if (!version || !Array.isArray(list)) continue
    const sortKey = Number(version[1]) * 1000 + Number(version[2])
    for (const device of list) {
      if (isDevice(device) && device.isAvailable !== false) {
        found.push({...device, runtime: `iOS ${version[1]}.${version[2]}`, sortKey})
      }
    }
  }

  return found.sort((a, b) => b.sortKey - a.sortKey)
}

function pickDevice(
  devices: SimulatorDevice[],
  name: string | undefined,
): SimulatorDevice | undefined {
  const candidates = devices.filter((device) =>
    name ? device.name === name : device.name.startsWith('iPhone'),
  )

  // Prefer a device that is already booted, so a simulator the developer has open is reused
  // as-is rather than a second one being started alongside it.
  return candidates.find((device) => device.state === 'Booted') ?? candidates[0]
}

function isDevice(value: unknown): value is Omit<SimulatorDevice, 'runtime' | 'sortKey'> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'udid' in value &&
    typeof value.udid === 'string' &&
    'name' in value &&
    typeof value.name === 'string' &&
    'state' in value &&
    typeof value.state === 'string'
  )
}
