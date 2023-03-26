import { setTimeout } from 'extra-timers'
import { isNumber, go, toArray, pass } from '@blackglory/prelude'
import { IStreamConfiguration, StreamLocked, StreamNotFound, StreamTimeout } from '@src/contract.js'
import { PassThrough, Readable } from 'stream'
import { pipeline } from 'stream/promises'
import { AbortError } from 'extra-abort'
import { waitForAllMacrotasksProcessed } from '@blackglory/wait-for'

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
        return setTimeout(config.timeToLive, () => {
          if (!stream.port.destroyed) {
            stream.port.destroy(new StreamTimeout())
          }
        })
      }
    })

    const port = new PassThrough({
      allowHalfOpen: false
    })
    port.once('error', pass)
    port.once('close', () => {
      cancelSchedule?.()
      idToStream.delete(stream.id)
    })

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
, payload: Readable
): Promise<void> {
  const stream = idToStream.get(id)
  if (stream) {
    if (stream.writeLocked) {
      throw new StreamLocked()
    } else {
      stream.writeLocked = true

      await pipeline(payload, stream.port)
    }
  } else {
    throw new StreamNotFound()
  }
}

export async function deleteAllStreams(): Promise<void> {
  const streams = toArray(idToStream.values())

  streams.forEach(stream => {
    if (!stream.port.destroyed) {
      stream.port.destroy(new AbortError())
    }
  })

  await waitForAllMacrotasksProcessed()
}
