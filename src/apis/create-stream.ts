import { createStream as _createStream } from '@dao/stream.js'
import { IConfig } from '@src/contract.js'

/**
 * @throws {StreamLocked}
 */
export function createStream(id: string, config: IConfig): void {
  _createStream(id, config)
}
