import { fetch } from 'extra-fetch'
import { post } from 'extra-request'
import { url, pathname, body, signal, header } from 'extra-request/transformers'
import { toText } from 'extra-response'
import { API } from '@apis/index.js'
import { startService, stopService, getAddress } from '@test/utils.js'
import { go } from '@blackglory/prelude'
import { delay } from 'extra-promise'
import { AbortError, timeoutSignal } from 'extra-abort'
import { getErrorPromise } from 'return-style'
import { hasStream } from '@dao/stream.js'
import { toNodeJSReadable } from './utils.js'
import { text } from 'stream/consumers'

beforeEach(startService)
afterEach(stopService)

describe('write stream', () => {
  test('stream does not exist', async () => {
    const id = 'id'
    const payload = toNodeJSReadable(go(function* () {
      yield 'data'
    }))

    const res = await fetch(post(
      url(getAddress())
    , pathname(`/streams/${id}`)
    , header('content-type', 'application/octet-stream')
    , body(payload)
    ))

    expect(res.status).toBe(404)
    expect(await toText(res)).toBe('')
    expect(hasStream(id)).toBe(false)
  })

  describe('stream exists', () => {
    test('stream is locked', async () => {
      const id = 'id'
      API.createStream(id, { timeToLive: null })
      // eslint-disable-next-line
      API.writeStream(id, toNodeJSReadable(go(function* () {
        yield 'data'
      })))
      const payload = toNodeJSReadable(go(function* () {
        yield 'data'
      }))

      const res = await fetch(post(
        url(getAddress())
      , pathname(`/streams/${id}`)
      , header('content-type', 'application/octet-stream')
      , body(payload)
      ))

      expect(res.status).toBe(409)
      expect(await toText(res)).toBe('')
      expect(hasStream(id)).toBe(true)
    })

    describe('stream isnt locked', () => {
      test('write, read', async () => {
        const id = 'id'
        API.createStream(id, { timeToLive: null })
        const payload = toNodeJSReadable(go(async function* () {
          yield 'data-1'
          await delay(1000)
          yield 'data-2'
        }))

        const res = await fetch(post(
          url(getAddress())
        , pathname(`/streams/${id}`)
        , header('content-type', 'application/octet-stream')
        , body(payload)
        ))
        const readable = API.readStream(id)
        const receivedPayload = text(readable)

        expect(res.status).toBe(204)
        expect(await toText(res)).toBe('')
        expect(hasStream(id)).toBe(true)
        expect(await receivedPayload).toBe(['data-1', 'data-2'].join(''))
        expect(hasStream(id)).toBe(false)
      })

      test('read, write', async () => {
        const id = 'id'
        API.createStream(id, { timeToLive: null })
        const readable = API.readStream(id)
        const receivedPayload = text(readable)
        const payload = toNodeJSReadable(go(function* () {
          yield 'data'
        }))

        const res = await fetch(post(
          url(getAddress())
        , pathname(`/streams/${id}`)
        , header('content-type', 'application/octet-stream')
        , body(payload)
        ))

        expect(res.status).toBe(204)
        expect(await toText(res)).toBe('')
        expect(await receivedPayload).toBe(['data'].join(''))
        expect(hasStream(id)).toBe(false)
      })

      test('Writable is closed before pipe is done', async () => {
        const id = 'id'
        API.createStream(id, { timeToLive: null })
        const readable = API.readStream(id)
        const receivedPayload = text(readable)
        const payload = toNodeJSReadable(go(async function* () {
          yield 'data-1'
          await delay(1000)
          yield 'data-2'
        }))

        const err = await getErrorPromise(fetch(post(
          url(getAddress())
        , pathname(`/streams/${id}`)
        , header('content-type', 'application/octet-stream')
        , body(payload)
        , signal(timeoutSignal(500))
        )))

        expect(err).toBeInstanceOf(AbortError)
        expect((await getErrorPromise(receivedPayload))?.message).toBe('aborted')
        expect(hasStream(id)).toBe(false)
      })

      test('Readable is closed before pipe is done', async () => {
        const id = 'id'
        API.createStream(id, { timeToLive: null })
        const readable = API.readStream(id)
        const receivedPayload = text(readable)
        const payload = toNodeJSReadable(go(async function* () {
          yield 'data-1'
          await delay(1000)
          yield 'data-2'
        }))

        // eslint-disable-next-line
        queueMicrotask(async () => {
          await delay(500)
          readable.destroy()
        })
        const err = await getErrorPromise(fetch(post(
          url(getAddress())
        , pathname(`/streams/${id}`)
        , header('content-type', 'application/octet-stream')
        , body(payload)
        )))

        expect(err?.name).toBe('FetchError')
        expect(await receivedPayload).toBe(['data-1'].join(''))
        expect(hasStream(id)).toBe(false)
      })
    })
  })
})
