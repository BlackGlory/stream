import { setTimeout } from 'extra-timers'
import { isNumber, go, toArray } from '@blackglory/prelude'
import { IStreamConfiguration, StreamLocked, StreamNotFound } from '@src/contract.js'
import { PassThrough, Readable } from 'stream'
import { pipeline } from 'stream/promises'

interface IStream {
  id: string
  port: PassThrough
  writeLocked: boolean
  readLocked: boolean
  cancelSchedule?: () => void
}

const idToStream = new Map<string, IStream>()

/**
 * @throws {StreamLocked}
 */
export function createStream(id: string, config: IStreamConfiguration): void {
  if (idToStream.has(id)) {
    throw new StreamLocked()
  } else {
    const cancelSchedule: (() => void) | undefined = go(() => {
      if (isNumber(config.timeToLive)) {
        return setTimeout(config.timeToLive, () => deleteStream(stream))
      }
    })

    const port = new PassThrough({
      allowHalfOpen: false
    })
    port.once('close', () => deleteStream(stream))

    const stream: IStream = {
      id
    , port
    , writeLocked: false
    , readLocked: false
    , cancelSchedule
    }
    idToStream.set(id, stream)
  }
}

export function hasStream(id: string): boolean {
  return idToStream.has(id)
}

/**
 * @throws {StreamLocked}
 * @throws {StreamNotFound}
 * @throws {AbortError}
 */
export function readStream(id: string): Readable {
  const stream = idToStream.get(id)
  if (stream) {
    if (stream.readLocked) {
      throw new StreamLocked()
    } else {
      stream.readLocked = true
      return stream.port
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
, readable: Readable
): Promise<void> {
  const stream = idToStream.get(id)
  if (stream) {
    if (stream.writeLocked) {
      throw new StreamLocked()
    } else {
      stream.writeLocked = true

      readable.once('close', () => {
        if (stream.readLocked) {
          deleteStream(stream)
        }
      })
      await pipeline(readable, stream.port)
    }
  } else {
    throw new StreamNotFound()
  }
}

function deleteStream(stream: IStream): void {
  stream.cancelSchedule?.()

  stream.port.destroy()

  if (idToStream.get(stream.id) === stream) {
    idToStream.delete(stream.id)
  }
}

export function deleteAllStreams(): void {
  const streams = toArray(idToStream.values())
  streams.forEach(deleteStream)
}
