import { readStream as _readStream } from '@dao/stream.js'
import { Readable } from 'stream'

/**
 * @throws {StreamLocked}
 * @throws {StreamNotFound}
 */
export function readStream(id: string): Readable {
  return _readStream(id)
}
