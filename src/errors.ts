/**
 * An extended version of the `Event` emitted by the `EventSource` object when an error occurs.
 * While the spec does not include any additional properties, we intentionally go beyond the spec
 * and provide some (minimal) additional information to aid in debugging.
 *
 * @public
 */
export class ErrorEvent extends Event {
  /**
   * HTTP status code, if this was triggered by an HTTP error
   * Note: this is not part of the spec, but is included for better error handling.
   *
   * @public
   */
  public code?: number | undefined

  /**
   * Optional message attached to the error.
   * Note: this is not part of the spec, but is included for better error handling.
   *
   * @public
   */
  public message?: string | undefined

  constructor(type: string, code?: number, message?: string) {
    super(type)
    this.code = code ?? undefined
    this.message = message ?? undefined
  }
}

/**
 * For environments where DOMException may not exist, we will use a SyntaxError instead.
 * While this isn't strictly according to spec, it is very close.
 *
 * @param message - The message to include in the error
 * @returns A `DOMException` or `SyntaxError` instance
 * @internal
 */
export function syntaxError(message: string): SyntaxError {
  // If someone can figure out a way to make this work without depending on DOM/Node.js typings,
  // and without casting to `any`, please send a PR 🙏

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const DomException = (globalThis as any).DOMException
  if (typeof DomException === 'function') {
    return new DomException(message, 'SyntaxError')
  }

  return new SyntaxError(message)
}

/**
 * Flatten an error into a single error message string.
 * Unwraps nested errors and joins them with a comma.
 *
 * @param err - The error to flatten
 * @returns A string representation of the error
 * @internal
 */
export function flattenError(err: unknown): string {
  if (!(err instanceof Error)) {
    return `${err}`
  }

  if ('errors' in err && Array.isArray(err.errors)) {
    return err.errors.map(flattenError).join(', ')
  }

  if ('cause' in err && err.cause instanceof Error) {
    return `${err}: ${flattenError(err.cause)}`
  }

  return err.message
}
