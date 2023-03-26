import { Readable } from 'stream'

export function toNodeJSReadable<T>(
  iterable: Iterable<T> | AsyncIterable<T>
): Readable {
  return Readable.from(iterable)
}
