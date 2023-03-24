import { setTimeout } from 'https://esm.sh/extra-timers@0.2.5'
import { isNumber, go, pass } from 'https://esm.sh/@blackglory/prelude@0.3.1'
import { Deferred, each } from 'https://esm.sh/extra-promise@6.0.5'
import { StreamLocked, StreamNotFound } from '@src/contract.ts'
import { AbortError } from 'https://esm.sh/extra-abort@0.3.3'
import { toAsyncIterableIterator } from 'https://esm.sh/extra-stream@0.2.0'

const idToStream = new Map<
  string
, {
    port: TransformStream<Uint8Array, Uint8Array>
    controller: AbortController
    writeEnd: Deferred<void>
    readEnd: Deferred<void>
    cancelSchedule?: () => void
  }
>()

/**
 * @throws {StreamLocked}
 */
export function createStream(id: string, timeToLive: number | null): void {
  if (idToStream.has(id)) {
    throw new StreamLocked()
  } else {
    const cancelSchedule: (() => void) | undefined = go(() => {
      if (isNumber(timeToLive)) {
        return setTimeout(timeToLive, () => deleteStream(id))
      }
    })

    const port = new TransformStream()
    const controller = new AbortController()
    const writeEnd = new Deferred<void>()
    const readEnd = new Deferred<void>()

    idToStream.set(id, {
      port
    , controller
    , writeEnd
    , readEnd
    , cancelSchedule
    })
  }
}

/**
 * @throws {StreamLocked}
 * @throws {StreamNotFound}
 * @throws {AbortError}
 */
export function readStream(id: string): AsyncIterableIterator<Uint8Array> {
  const stream = idToStream.get(id)
  if (stream) {
    const { port, readEnd } = stream
    const { readable } = port

    if (readable.locked) {
      throw new StreamLocked()
    } else {
      const iter = toAsyncIterableIterator(readable)

      return go(async function* (): AsyncIterableIterator<Uint8Array> {
        try {
          for await (const chunk of iter) {
            yield chunk
          }
        } finally {
          readEnd.resolve()
          await deleteStream(id)
        }
      })
    }
  } else {
    throw new StreamNotFound()
  }
}

/**
 * @throws {StreamLocked}
 * @throws {StreamNotFound}
 */
export async function writeStream(
  id: string
, readable: ReadableStream<Uint8Array>
): Promise<void> {
  const stream = idToStream.get(id)
  if (stream) {
    const { port } = stream
    const { writable } = port

    if (writable.locked) {
      throw new StreamLocked()
    } else {
      const { controller, writeEnd } = stream

      try {
        await readable.pipeTo(writable, { signal: controller.signal })
      } catch (e) {
        if (e instanceof AbortError) {
          pass()
        } else {
          throw e
        }
      } finally {
        writeEnd.resolve()
        await deleteStream(id)
      }
    }
  } else {
    throw new StreamNotFound()
  }
}

export async function deleteStream(id: string): Promise<void> {
  const stream = idToStream.get(id)
  if (stream) {
    const { cancelSchedule, controller, writeEnd, readEnd, port } = stream
    const { readable, writable } = port

    cancelSchedule?.()
    controller.abort()

    if (writable.locked) {
      await writeEnd
    }

    if (readable.locked) {
      await readEnd
    }

    idToStream.delete(id)
  }
}

export function hasStream(id: string): boolean {
  return idToStream.has(id)
}

export async function clearStreams(): Promise<void> {
  await each(idToStream.keys(), async id => {
    await deleteStream(id)
  })
}
