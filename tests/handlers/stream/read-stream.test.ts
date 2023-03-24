import { assertEquals, assertInstanceOf } from 'https://deno.land/std@0.158.0/testing/asserts.ts'
import { describe, it, beforeEach, afterEach } from 'https://deno.land/std@0.158.0/testing/bdd.ts'
import { fetch } from 'https://esm.sh/extra-fetch@4.0.4'
import { get } from 'https://esm.sh/extra-request@8.3.0'
import * as transformers from 'https://esm.sh/extra-request@8.3.0/transformers'
import { toText } from 'https://esm.sh/extra-response@0.5.1'
import { API } from '@apis/index.ts'
import { startService, stopService, getAddress } from '@test/utils.ts'
import { go } from 'https://esm.sh/@blackglory/prelude@0.3.1'
import { setImmediate } from 'https://esm.sh/extra-timers@0.2.5'
import { AbortController, AbortError, timeoutSignal, withAbortSignal } from 'https://esm.sh/extra-abort@0.3.3'
import { delay } from 'https://esm.sh/extra-promise@6.0.5'
import { toReadableByteStream } from './utils.ts'
import { getErrorPromise } from 'https://esm.sh/return-style@3.0.0'

beforeEach(startService)
afterEach(stopService)

describe('read stream', () => {
  it('stream does not exist', async () => {
    const id = 'id'

    const res = await fetch(get(
      transformers.url(getAddress())
    , transformers.pathname(`/streams/${id}`)
    ))

    assertEquals(res.status, 404)
    assertEquals(await toText(res), '')
    assertEquals(API.hasStream(id), false)
  })

  describe('stream exists', () => {
    it('stream is locked', async () => {
      const id = 'id'
      API.createStream(id, null)
      const iterator = API.readStream(id)

      try {
        const res = await fetch(get(
          transformers.url(getAddress())
        , transformers.pathname(`/streams/${id}`)
        ))

        assertEquals(res.status, 409)
        assertEquals(await toText(res), '')
        assertEquals(API.hasStream(id), true)
      } finally {
        iterator.throw?.()
      }
    })

    describe('stream isnt locked', () => {
      it('write, read', async () => {
        const id = 'id'
        API.createStream(id, null)
        API.writeStream(id, toReadableByteStream(go(function* () {
          yield 'data'
        })))

        const res = await fetch(get(
          transformers.url(getAddress())
        , transformers.pathname(`/streams/${id}`)
        ))

        assertEquals(res.status, 200)
        assertEquals(await toText(res), 'data')
        assertEquals(API.hasStream(id), false)
      })

      it('read, write', async () => {
        const id = 'id'
        API.createStream(id, null)
        setImmediate(() => {
          API.writeStream(id, toReadableByteStream(go(function* () {
            yield 'data'
          })))
        })

        const res = await fetch(get(
          transformers.url(getAddress())
        , transformers.pathname(`/streams/${id}`)
        ))

        assertEquals(res.status, 200)
        assertEquals(await toText(res), 'data')
        assertEquals(API.hasStream(id), false)
      })

      it('close ReadableStream before it is done', async () => {
        const id = 'id'
        API.createStream(id, null)
        const promise = API.writeStream(id, toReadableByteStream(go(async function* () {
          yield 'data-1'
          await delay(1000)
          yield 'data-2'
        })))

        const res = await fetch(get(
          transformers.url(getAddress())
        , transformers.pathname(`/streams/${id}`)
        , transformers.signal(timeoutSignal(500))
        ))

        assertEquals(res.status, 200)
        assertInstanceOf(await getErrorPromise(toText(res)), AbortError)
        assertEquals(API.hasStream(id), false)
        await promise
      })

      it('close WritableStream before it is done', async () => {
        const id = 'id'
        API.createStream(id, null)
        const controller = new AbortController()
        const promise = API.writeStream(id, toReadableByteStream(go(async function* () {
          yield 'data-1'
          await withAbortSignal(controller.signal, () => delay(1000))
          yield 'data-2'
        })))

        const res = await fetch(get(
          transformers.url(getAddress())
        , transformers.pathname(`/streams/${id}`)
        ))
        controller.abort()

        assertEquals(res.status, 200)
        assertInstanceOf(await getErrorPromise(toText(res)), TypeError)
        assertEquals(API.hasStream(id), false)
        await promise
      })
    })
  })
})
