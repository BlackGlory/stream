import { toReadableStream } from 'https://esm.sh/extra-stream@0.2.0'
import { mapAsync } from 'https://esm.sh/iterable-operator@4.0.3'
import { pipe } from 'https://esm.sh/extra-utils@5.1.0'

export function stringToUTF8(text: string): Uint8Array {
  const encoder = new TextEncoder()
  return encoder.encode(text)
}

export function toReadableByteStream(
  iterable: Iterable<string> | AsyncIterable<string>
): ReadableStream<Uint8Array> {
  return pipe(
    iterable
  , iter => mapAsync(iter, stringToUTF8)
  , toReadableStream
  )
}
