import type {TestEndEvent, TestFailEvent, TestPassEvent, TestStartEvent} from '../types.js'

export function indent(str: string, spaces: number): string {
  return str
    .split('\n')
    .map((line) => ' '.repeat(spaces) + line)
    .join('\n')
}

export function getStartText(event: TestStartEvent): string {
  return `Running ${event.tests} tests…`
}

export function getPassText(event: TestPassEvent): string {
  return `✅ ${event.title} (${event.duration}ms)`
}

export function getFailText(event: TestFailEvent): string {
  return `❌ ${event.title} (${event.duration}ms)\n${indent(event.error, 3)}`
}

export function getEndText(event: TestEndEvent): string {
  const {failures, passes, tests} = event
  return `Ran ${tests} tests, ${passes} passed, ${failures} failed`
}
