/* eslint-disable no-process-env, no-console */
import type {
  TestEndEvent,
  TestFailEvent,
  TestPassEvent,
  TestReporter,
  TestStartEvent,
} from '../types.js'
import {getEndText, getFailText, getPassText, getStartText} from './helpers.js'

export const defaultReporter: Required<Omit<TestReporter, 'onEvent'>> = {
  onStart: reportStart,
  onEnd: reportEnd,
  onPass: reportPass,
  onFail: reportFail,
}

export function reportStart(event: TestStartEvent): void {
  console.log(getStartText(event))
}

export function reportPass(event: TestPassEvent): void {
  console.log(getPassText(event))
}

export function reportFail(event: TestFailEvent): void {
  console.log(getFailText(event))
}

export function reportEnd(event: TestEndEvent): void {
  console.log(getEndText(event))
}
