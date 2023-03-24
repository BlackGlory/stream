import { assertEquals, assertInstanceOf } from 'https://deno.land/std@0.158.0/testing/asserts.ts'
import { describe, it, beforeEach, afterEach } from 'https://deno.land/std@0.158.0/testing/bdd.ts'
import { fetch } from 'https://esm.sh/extra-fetch@4.0.4'
import { post } from 'https://esm.sh/extra-request@8.3.0'
import * as transformers from 'https://esm.sh/extra-request@8.3.0/transformers'
import { toText } from 'https://esm.sh/extra-response@0.5.1'
import { API } from '@apis/index.ts'
import { startService, stopService, getAddress } from '@test/utils.ts'
import { go, toArrayAsync } from 'https://esm.sh/@blackglory/prelude@0.3.1'
import { setImmediate } from 'https://esm.sh/extra-timers@0.2.5'
import { toReadableByteStream, stringToUTF8 } from './utils.ts'
import { delay } from 'https://esm.sh/extra-promise@6.0.5'
import { AbortError, timeoutSignal } from 'https://esm.sh/extra-abort@0.3.3'
import { getErrorPromise } from 'https://esm.sh/return-style@3.0.0'

beforeEach(startService)
afterEach(stopService)

describe('write stream', () => {
  it('stream does not exist', async () => {
    const id = 'id'
    const readableStream = toReadableByteStream(go(function* () {
      yield 'data'
    }))

    const res = await fetch(post(
      transformers.url(getAddress())
    , transformers.pathname(`/streams/${id}`)
    , transformers.body(readableStream)
    ))

    assertEquals(res.status, 404)
    assertEquals(await toText(res), '')
    assertEquals(API.hasStream(id), false)
  })

  describe('stream exists', () => {
    it('stream is locked', async () => {
      const id = 'id'
      API.createStream(id, null)
      API.writeStream(id, toReadableByteStream(go(function* () {
        yield 'data'
      })))
      const readableStream = toReadableByteStream(go(function* () {
        yield 'data'
      }))

      const res = await fetch(post(
        transformers.url(getAddress())
      , transformers.pathname(`/streams/${id}`)
      , transformers.body(readableStream)
      ))

      assertEquals(res.status, 409)
      assertEquals(await toText(res), '')
      assertEquals(API.hasStream(id), true)
      assertEquals(
        await toArrayAsync(API.readStream(id))
      , [stringToUTF8('data')]
      )
    })

    describe('stream isnt locked', () => {
      it('write, read', async () => {
        const id = 'id'
        API.createStream(id, null)
        const readableStream = toReadableByteStream(go(function* () {
          yield 'data'
        }))
        const promise = new Promise<Uint8Array[]>((resolve, reject) => {
          setImmediate(async () => {
            try {
              resolve(await toArrayAsync(API.readStream(id)))
            } catch (e) {
              reject(e)
            }
          })
        })

        const res = await fetch(post(
          transformers.url(getAddress())
        , transformers.pathname(`/streams/${id}`)
        , transformers.body(readableStream)
        ))

        assertEquals(res.status, 204)
        assertEquals(await toText(res), '')
        assertEquals(API.hasStream(id), false)
        assertEquals(await promise, [stringToUTF8('data')])
      })

      it('read, write', async () => {
        const id = 'id'
        API.createStream(id, null)
        const promise = toArrayAsync(API.readStream(id))
        const readableStream = toReadableByteStream(go(function* () {
          yield 'data'
        }))

        const res = await fetch(post(
          transformers.url(getAddress())
        , transformers.pathname(`/streams/${id}`)
        , transformers.body(readableStream)
        ))

        assertEquals(res.status, 204)
        assertEquals(await toText(res), '')
        assertEquals(API.hasStream(id), false)
        assertEquals(await promise, [stringToUTF8('data')])
      })

      it.ignore('close WritableStream before it is done', async () => {
        const id = 'id'
        API.createStream(id, null)
        const promise = toArrayAsync(API.readStream(id))
        const readableStream = toReadableByteStream(go(async function* () {
          yield 'data-1'
          await delay(1000)
          yield 'data-2'
        }))

        const res = await fetch(post(
          transformers.url(getAddress())
        , transformers.pathname(`/streams/${id}`)
        , transformers.body(readableStream)
        , transformers.signal(timeoutSignal(500))
        ))

        assertEquals(res.status, 200)
        assertInstanceOf(await getErrorPromise(toText(res)), AbortError)
        assertEquals(API.hasStream(id), false)
        assertEquals(await promise, [stringToUTF8('data-1')])
      })

      it.ignore('close ReadableStream before it is done', async () => {

      })
    })
  })
})
