import { deleteAllStreams, createStream, deleteStream, hasStream, readStream, writeStream } from '@dao/stream.js'

afterEach(() => deleteAllStreams())

test('deleteAllStreams', () => {
  const id = 'id'

  const stream = createStream(id, { timeToLive: null })
})
