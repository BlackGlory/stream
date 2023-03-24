import { IAPI } from '@src/contract.ts'
import {
  createStream
, hasStream
, readStream
, writeStream
, deleteStream
, clearStreams
} from './stream.ts'

export const API: IAPI = {
  createStream
, hasStream
, readStream
, writeStream
, deleteStream
, clearStreams
}
