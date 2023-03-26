import { fetch } from 'extra-fetch'
import { get } from 'extra-request'
import { url, pathname, signal } from 'extra-request/transformers'
import { toText } from 'extra-response'
import { API } from '@apis/index.js'
import { startService, stopService, getAddress } from '@test/utils.js'
import { go, pass } from '@blackglory/prelude'
import { AbortError, timeoutSignal } from 'extra-abort'
import { delay } from 'extra-promise'
import { getErrorPromise } from 'return-style'
import { hasStream } from '@dao/stream.js'
import { toNodeJSReadable } from './utils.js'
import { waitForFunction } from '@blackglory/wait-for'

beforeEach(startService)
afterEach(stopService)

describe('read stream', () => {
  test('stream does not exist', async () => {
    const id = 'id'

    const res = await fetch(get(
      url(getAddress())
    , pathname(`/streams/${id}`)
    ))

    expect(res.status).toBe(404)
    expect(await toText(res)).toBe('')
    expect(hasStream(id)).toBe(false)
  })

  describe('stream exists', () => {
    test('stream is locked', async () => {
      const id = 'id'
      API.createStream(id, { timeToLive: null })
      API.readStream(id)

      const res = await fetch(get(
        url(getAddress())
      , pathname(`/streams/${id}`)
      ))

      expect(res.status).toBe(409)
      expect(await toText(res)).toBe('')
      expect(hasStream(id)).toBe(true)
    })

    describe('stream isnt locked', () => {
      test('write, read', async () => {
        const id = 'id'
        API.createStream(id, { timeToLive: null })
        // eslint-disable-next-line
        API.writeStream(id, toNodeJSReadable(go(async function* () {
          yield 'data-1'
          await delay(1000)
          yield 'data-2'
        })))

        const res = await fetch(get(
          url(getAddress())
        , pathname(`/streams/${id}`)
        ))

        expect(res.status).toBe(200)
        expect(res.headers.get('content-type')).toBe('application/octet-stream')
        expect(await toText(res)).toBe(['data-1', 'data-2'].join(''))
        expect(hasStream(id)).toBe(false)
      })

      test('read, write', async () => {
        const id = 'id'
        API.createStream(id, { timeToLive: null })

        const res = await fetch(get(
          url(getAddress())
        , pathname(`/streams/${id}`)
        ))
        // eslint-disable-next-line
        API.writeStream(id, toNodeJSReadable(go(function* () {
          yield 'data'
        })))

        expect(res.status).toBe(200)
        expect(res.headers.get('content-type')).toBe('application/octet-stream')
        expect(await toText(res)).toBe('data')
        expect(hasStream(id)).toBe(false)
      })
    })
  })

  test('edge: Readable is closed before pipe is done', async () => {
    const id = 'id'
    API.createStream(id, { timeToLive: null })
    API.writeStream(id, toNodeJSReadable(go(async function* () {
      yield 'data-1'
      await delay(1000)
      yield 'data-2'
    }))).catch(pass)

    const res = await fetch(get(
      url(getAddress())
    , pathname(`/streams/${id}`)
    , signal(timeoutSignal(500))
    ))

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/octet-stream')
    expect(await getErrorPromise(toText(res))).toBeInstanceOf(AbortError)
    await waitForFunction(() => hasStream(id) === false)
  })

  test('edge: Writable is closed before pipe is done', async () => {
    const id = 'id'
    API.createStream(id, { timeToLive: null })
    const readable = toNodeJSReadable(go(async function* () {
      yield 'data-1'
      await delay(1000)
      yield 'data-2'
    }))
    API.writeStream(id, readable).catch(pass)

    // eslint-disable-next-line
    queueMicrotask(async () => {
      await delay(500)
      readable.destroy()
    })
    const res = await fetch(get(
      url(getAddress())
    , pathname(`/streams/${id}`)
    ))

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/octet-stream')
    expect((await getErrorPromise(toText(res)))?.name).toBe('FetchError')
    expect(hasStream(id)).toBe(false)
  })

  test('edge: Writable is closed before Readable is created', async () => {
    const id = 'id'
    API.createStream(id, { timeToLive: null })
    const readable = toNodeJSReadable(go(async function* () {
      yield 'data-1'
      await delay(1000)
      yield 'data-2'
    }))
    API.writeStream(id, readable).catch(pass)
    readable.destroy()

    const res = await fetch(get(
      url(getAddress())
    , pathname(`/streams/${id}`)
    ))

    expect(res.status).toBe(404)
    expect(await toText(res)).toBe('')
    expect(hasStream(id)).toBe(false)
  })
})
