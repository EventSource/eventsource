/**
 * Boots the simulator that `npm run test:ios` will use, waits for it to finish starting up, and
 * launches Safari on it.
 *
 * Run as a step before the suite (see the `Test: iOS Simulator` job), because both of those costs
 * are otherwise paid against a timeout that is already counting down. A cold boot takes minutes
 * while Vitest's `browser.connectTimeout` runs, and Safari's first launch takes longer than
 * `simctl openurl` waits for it.
 */
import {bootSimulator} from '../test/helpers/iosSimulator.ts'

const started = Date.now()
const device = await bootSimulator(process.env['IOS_SIMULATOR_DEVICE'])
const seconds = ((Date.now() - started) / 1000).toFixed(1)

console.log(
  `Booted ${device.name}, ${device.runtime} (${device.udid}) and started Safari in ${seconds}s`,
)
