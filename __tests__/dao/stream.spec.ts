import { createStream, hasStream, readStream, writeStream, deleteAllStreams } from '@dao/stream.js'
import { getError, getErrorPromise } from 'return-style'
import { delay } from 'extra-promise'
import { StreamLocked, StreamNotFound } from '@src/contract.js'
import { go, pass } from '@blackglory/prelude'
import { toNodeJSReadable } from '@test/utils.js'
import { text } from 'stream/consumers'
import { AbortError } from 'extra-abort'

afterEach(() => deleteAllStreams())

describe('createStream', () => {
  test('stream exists', () => {
    const id = 'id'

    createStream(id, { timeToLive: null })
    const err = getError(() => createStream(id, { timeToLive: null }))

    expect(err).toBeInstanceOf(StreamLocked)
    expect(hasStream(id)).toBe(true)
  })

  describe('stream does not exist', () => {
    describe('timeToLive', () => {
      test('timeToLive is null', async () => {
        const id = 'id'
        const timeToLive = null

        createStream(id, { timeToLive })

        await delay(1000)
        expect(hasStream(id)).toBe(true)
      })

      test('timeToLive isnt null', async () => {
        const id = 'id'
        const timeToLive = 1000

        createStream(id, { timeToLive })

        await delay(900)
        expect(hasStream(id)).toBe(true)
        await delay(1000)
        expect(hasStream(id)).toBe(false)
      })
    })
  })
})

describe('hasStream', () => {
  test('stream exists', () => {
    const id = 'id'
    createStream(id, { timeToLive: null })

    const result = hasStream(id)

    expect(result).toBe(true)
  })

  test('stream does not exist', () => {
    const id = 'id'

    const result = hasStream(id)

    expect(result).toBe(false)
  })
})

describe('readStream', () => {
  test('stream does not exist', () => {
    const id = 'id'

    const err = getError(() => readStream(id))

    expect(err).toBeInstanceOf(StreamNotFound)
    expect(hasStream(id)).toBe(false)
  })

  describe('stream exists', () => {
    test('stream is locked', () => {
      const id = 'id'
      createStream(id, { timeToLive: null })
      const readable = readStream(id)

      const err = getError(() => readStream(id))

      expect(err).toBeInstanceOf(StreamLocked)
      expect(hasStream(id)).toBe(true)
    })

    describe('stream isnt locked', () => {
      test('write, read', async () => {
        const id = 'id'
        createStream(id, { timeToLive: null })
        writeStream(id, toNodeJSReadable(go(async function* () {
          yield 'data-1'
          await delay(1000)
          yield 'data-2'
        }))).catch(pass)

        const readable = readStream(id)
        const result = await text(readable)

        expect(result).toBe(['data-1', 'data-2'].join(''))
        expect(hasStream(id)).toBe(false)
      })

      test('read, write', async () => {
        const id = 'id'
        createStream(id, { timeToLive: null })

        const readable = readStream(id)
        writeStream(id, toNodeJSReadable(go(function* () {
          yield 'data'
        }))).catch(pass)
        const result = await text(readable)

        expect(result).toBe(['data'].join(''))
        expect(hasStream(id)).toBe(false)
      })
    })
  })

  test('edge: Readable is closed before pipe is done', async () => {
    const id = 'id'
    createStream(id, { timeToLive: null })
    writeStream(id, toNodeJSReadable(go(async function* () {
      yield 'data-1'
      await delay(1000)
      yield 'data-2'
    }))).catch(pass)

    const readable = readStream(id)
    // eslint-disable-next-line
    queueMicrotask(async () => {
      await delay(500)
      readable.destroy(new AbortError())
    })
    const err = await getErrorPromise(text(readable))

    expect(err).toBeInstanceOf(AbortError)
    expect(hasStream(id)).toBe(false)
  })

  test('edge: Writable is closed before pipe is done', async () => {
    const id = 'id'
    createStream(id, { timeToLive: null })
    const payload = toNodeJSReadable(go(async function* () {
      yield 'data-1'
      await delay(1000)
      yield 'data-2'
    }))
    writeStream(id, payload).catch(pass)

    // eslint-disable-next-line
    queueMicrotask(async () => {
      await delay(500)
      payload.destroy(new AbortError())
    })
    const readable = readStream(id)
    const err = await getErrorPromise(text(readable))

    expect(err).toBeInstanceOf(AbortError)
    expect(hasStream(id)).toBe(false)
  })

  test('edge: Writable is closed before Readable is created', async () => {
    const id = 'id'
    createStream(id, { timeToLive: null })
    const payload = toNodeJSReadable(go(async function* () {
      yield 'data-1'
      await delay(1000)
      yield 'data-2'
    }))
    writeStream(id, payload).catch(pass)
    payload.destroy(new AbortError())

    const readable = readStream(id)
    const err = await getErrorPromise(text(readable))

    expect(err).toBeInstanceOf(AbortError)
    expect(hasStream(id)).toBe(false)
  })
})

describe('writeStream', () => {
  test('stream does not exist', async () => {
    const id = 'id'
    const payload = toNodeJSReadable(go(function* () {
      yield 'data'
    }))

    const err = await getErrorPromise(writeStream(id, payload))

    expect(err).toBeInstanceOf(StreamNotFound)
    expect(hasStream(id)).toBe(false)
  })

  describe('stream exists', () => {
    test('stream is locked', async () => {
      const id = 'id'
      createStream(id, { timeToLive: null })
      writeStream(id, toNodeJSReadable(go(function* () {
        yield 'data'
      }))).catch(pass)
      const payload = toNodeJSReadable(go(function* () {
        yield 'data'
      }))

      const err = await getErrorPromise(writeStream(id, payload))

      expect(err).toBeInstanceOf(StreamLocked)
      expect(hasStream(id)).toBe(true)
    })

    describe('stream isnt locked', () => {
      test('write, read', async () => {
        const id = 'id'
        createStream(id, { timeToLive: null })
        const payload = toNodeJSReadable(go(async function* () {
          yield 'data-1'
          await delay(1000)
          yield 'data-2'
        }))

        await writeStream(id, payload)
        const readable = readStream(id)
        const promise = text(readable)

        expect(hasStream(id)).toBe(true)
        expect(await promise).toBe(['data-1', 'data-2'].join(''))
        expect(hasStream(id)).toBe(false)
      })

      test('read, write', async () => {
        const id = 'id'
        createStream(id, { timeToLive: null })
        const readable = readStream(id)
        const promise = text(readable)
        const payload = toNodeJSReadable(go(function* () {
          yield 'data'
        }))

        await writeStream(id, payload)

        expect(await promise).toBe((['data'].join('')))
        expect(hasStream(id)).toBe(false)
      })
    })
  })

  test('edge: Writable is closed before pipe is done', async () => {
    const id = 'id'
    createStream(id, { timeToLive: null })
    const readable = readStream(id)
    const receivedPayload = text(readable)
    const payload = toNodeJSReadable(go(async function* () {
      yield 'data-1'
      await delay(1000)
      yield 'data-2'
    }))

    // eslint-disable-next-line
    queueMicrotask(async () => {
      await delay(500)
      payload.destroy(new AbortError())
    })
    const err = await getErrorPromise(writeStream(id, payload))

    expect(err).toBeInstanceOf(AbortError)
    expect(await getErrorPromise(receivedPayload)).toBeInstanceOf(AbortError)
    expect(hasStream(id)).toBe(false)
  })

  test('edge: Readable is closed before pipe is done', async () => {
    const id = 'id'
    createStream(id, { timeToLive: null })
    const readable = readStream(id)
    const receivedPayload = text(readable)
    const payload = toNodeJSReadable(go(async function* () {
      yield 'data-1'
      await delay(1000)
      yield 'data-2'
    }))

    // eslint-disable-next-line
    queueMicrotask(async () => {
      await delay(500)
      readable.destroy(new AbortError())
    })
    const err = await getErrorPromise(writeStream(id, payload))

    expect(err).toBeInstanceOf(AbortError)
    expect(await getErrorPromise(receivedPayload)).toBeInstanceOf(AbortError)
    expect(hasStream(id)).toBe(false)
  })

  test('edge: Readable is closed before Writable is created', async () => {
    const id = 'id'
    createStream(id, { timeToLive: null })
    const readable = readStream(id)
    const receivedPayload = text(readable)
    const payload = toNodeJSReadable(go(async function* () {
      yield 'data-1'
      await delay(1000)
      yield 'data-2'
    }))
    readable.destroy(new AbortError())

    const err = await getErrorPromise(writeStream(id, payload))

    expect(err).toBeInstanceOf(AbortError)
    expect(await getErrorPromise(receivedPayload)).toBeInstanceOf(AbortError)
    expect(hasStream(id)).toBe(false)
  })
})

test('deleteAllStreams', () => {
  const id = 'id'
  createStream(id, { timeToLive: null })

  deleteAllStreams()

  expect(hasStream(id)).toBe(false)
})
