import { writeStream as _writeStream } from '@dao/stream.js'
import { Readable } from 'stream'

/**
 * @throws {StreamLocked}
 * @throws {StreamNotFound}
 */
export async function writeStream(id: string, readable: Readable): Promise<void> {
  return await _writeStream(id, readable)
}
