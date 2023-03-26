import { IAPI } from '@src/contract.js'
import { createStream } from './create-stream.js'
import { readStream } from './read-stream.js'
import { writeStream } from './write-stream.js'

export const API: IAPI = {
  createStream
, readStream
, writeStream
}
