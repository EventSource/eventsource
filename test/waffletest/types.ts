export type TestFn = () => void | Promise<void>

export interface TestReporter {
  onEvent?: (event: TestEvent) => void
  onStart?: (event: TestStartEvent) => void
  onPass?: (event: TestPassEvent) => void
  onFail?: (event: TestFailEvent) => void
  onEnd?: (event: TestEndEvent) => void
}

// Equal for now, but might extend
export type TestRunnerOptions = TestReporter

export type RegisterTest = ((
  title: string,
  fn: TestFn,
  timeout?: number,
  only?: boolean,
) => void) & {
  only: (title: string, fn: TestFn, timeout?: number) => void
}

export interface TestRunner {
  isRunning(): boolean
  getTestCount(): number
  registerTest: RegisterTest
  runTests: () => Promise<TestEndEvent>
}

export type TestEvent = TestStartEvent | TestPassEvent | TestFailEvent | TestEndEvent

export interface TestStartEvent {
  event: 'start'
  tests: number
}

export interface TestPassEvent {
  event: 'pass'
  title: string
  duration: number
}

export interface TestFailEvent {
  event: 'fail'
  title: string
  duration: number
  error: string
}

export interface TestEndEvent {
  event: 'end'
  success: boolean
  tests: number
  passes: number
  failures: number
  duration: number
}
