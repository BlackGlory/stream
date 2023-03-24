import { CustomError } from 'https://esm.sh/@blackglory/errors@3.0.0'

export interface IAPI {
  /**
   * @throws {StreamLocked}
   */
  createStream(id: string, timeToLive: number | null): void

  hasStream(id: string): boolean

  /**
   * @throws {StreamLocked}
   * @throws {StreamNotFound}
   */
  readStream(id: string): AsyncIterableIterator<Uint8Array>

  /**
   * @throws {StreamLocked}
   * @throws {StreamNotFound}
   */
  writeStream(id: string, readable: ReadableStream<Uint8Array>): Promise<void>

  /**
   * @throws {StreamLocked}
   * @throws {StreamNotFound}
   */
  deleteStream(id: string): Promise<void>

  clearStreams(): Promise<void>
}

export class StreamLocked extends CustomError {}
export class StreamNotFound extends CustomError {}
