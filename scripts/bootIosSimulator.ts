/**
 * Boots the simulator that `npm run test:ios` will use, and waits for it to finish starting up.
 *
 * Run as a step before the suite (see the `Test: iOS Simulator` job): a cold boot can take
 * minutes, and Vitest's `browser.connectTimeout` is already counting down while the provider
 * boots, so on a runner where every simulator is shut down the boot eats the whole budget and
 * the run fails with "Failed to connect to the browser session within the timeout".
 */
import {bootSimulator} from '../test/helpers/iosSimulator.ts'

const started = Date.now()
const device = await bootSimulator(process.env['IOS_SIMULATOR_DEVICE'])
const seconds = ((Date.now() - started) / 1000).toFixed(1)

console.log(`Booted ${device.name}, ${device.runtime} (${device.udid}) in ${seconds}s`)
