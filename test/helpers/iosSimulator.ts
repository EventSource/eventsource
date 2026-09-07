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

interface SimulatorDevice {
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
    await exec('xcrun', ['simctl', 'openurl', device.udid, url])
  }

  async close(): Promise<void> {
    if (!this.booted) return
    // Leave the simulator booted - booting costs the better part of a minute, and a developer
    // running the suite repeatedly should not pay it every time - but close Safari, so the next
    // run starts on a blank page instead of restoring the previous tester page.
    await exec('xcrun', ['simctl', 'terminate', this.booted.udid, SAFARI_BUNDLE_ID]).catch(() => {})
  }

  private async boot(): Promise<SimulatorDevice> {
    if (this.booted) return this.booted

    const {stdout} = await exec('xcrun', ['simctl', 'list', 'devices', 'available', '--json'])
    const devices = listDevices(stdout)
    const device = pickDevice(devices, this.device)
    if (!device) {
      throw new Error(
        `Found no available iOS simulator ${this.device ? `named "${this.device}"` : 'to run on'}. ` +
          `\`xcrun simctl list devices available\` lists what is installed; ` +
          `\`xcodebuild -downloadPlatform iOS\` installs a runtime if none is.`,
      )
    }

    if (device.state !== 'Booted') {
      // `bootstatus -b` boots the device and waits until it has finished starting up, so the
      // first `openurl` does not race the boot. The simulator does not need Simulator.app to be
      // open to run Safari, so nothing here brings up a UI.
      await exec('xcrun', ['simctl', 'bootstatus', device.udid, '-b'], {timeout: 300_000})
    }

    this.booted = device
    return device
  }
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
