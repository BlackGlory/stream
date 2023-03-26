import { CustomError } from '@blackglory/errors'
import { Readable } from 'stream'

export interface IConfig {
  timeToLive: number | null
}

export interface IAPI {
  /**
   * @throws {StreamLocked}
   */
  createStream(id: string, config: IConfig): void

  /**
   * @throws {StreamLocked}
   * @throws {StreamNotFound}
   */
  readStream(id: string): Readable

  /**
   * @throws {StreamLocked}
   * @throws {StreamNotFound}
   */
  writeStream(id: string, readable: Readable): Promise<void>
}

export class StreamLocked extends CustomError {}
export class StreamNotFound extends CustomError {}
