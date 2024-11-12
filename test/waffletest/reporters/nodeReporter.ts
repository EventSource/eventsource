/* eslint-disable no-process-env, no-console */
import {platform} from 'node:os'
import {isatty} from 'node:tty'

import type {
  TestEndEvent,
  TestFailEvent,
  TestPassEvent,
  TestReporter,
  TestStartEvent,
} from '../types.js'
import {getEndText, getFailText, getPassText, getStartText} from './helpers.js'

const CAN_USE_COLORS = canUseColors()

export const nodeReporter: Required<Omit<TestReporter, 'onEvent'>> = {
  onStart: reportStart,
  onEnd: reportEnd,
  onPass: reportPass,
  onFail: reportFail,
}

export function reportStart(event: TestStartEvent): void {
  console.log(`${getStartText(event)}\n`)
}

export function reportPass(event: TestPassEvent): void {
  console.log(green(getPassText(event)))
}

export function reportFail(event: TestFailEvent): void {
  console.log(red(getFailText(event)))
}

export function reportEnd(event: TestEndEvent): void {
  console.log(`\n${getEndText(event)}`)
}

function red(str: string): string {
  return CAN_USE_COLORS ? `\x1b[31m${str}\x1b[39m` : str
}

function green(str: string): string {
  return CAN_USE_COLORS ? `\x1b[32m${str}\x1b[39m` : str
}

function getEnv(envVar: string): string | undefined {
  if (typeof process !== 'undefined' && 'env' in process && typeof process.env === 'object') {
    return process.env[envVar]
  }

  if (typeof globalThis.Deno !== 'undefined') {
    return globalThis.Deno.env.get(envVar)
  }

  throw new Error('Unable to find environment variables')
}

function hasEnv(envVar: string): boolean {
  return typeof getEnv(envVar) !== 'undefined'
}

function canUseColors(): boolean {
  const isWindows = platform() === 'win32'
  const isDumbTerminal = getEnv('TERM') === 'dumb'
  const isCompatibleTerminal = isatty(1) && getEnv('TERM') && !isDumbTerminal
  const isCI =
    hasEnv('CI') && (hasEnv('GITHUB_ACTIONS') || hasEnv('GITLAB_CI') || hasEnv('CIRCLECI'))
  return (isWindows && !isDumbTerminal) || isCompatibleTerminal || isCI
}
