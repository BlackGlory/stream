import { createStream as _createStream } from '@dao/stream.js'
import { IStreamConfiguration } from '@src/contract.js'

/**
 * @throws {StreamLocked}
 */
export function createStream(id: string, config: IStreamConfiguration): void {
  _createStream(id, config)
}
