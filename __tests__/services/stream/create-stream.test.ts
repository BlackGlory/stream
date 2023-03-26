import { fetch } from 'extra-fetch'
import { put } from 'extra-request'
import { url, pathname, json } from 'extra-request/transformers'
import { toText } from 'extra-response'
import { API } from '@apis/index.js'
import { startService, stopService, getAddress } from '@test/utils.js'
import { hasStream } from '@dao/stream.js'
import { delay } from 'extra-promise'
import { IStreamConfiguration } from '@src/contract.js'

beforeEach(startService)
afterEach(stopService)

describe('create stream', () => {
  test('stream exists', async () => {
    const id = 'id'
    API.createStream(id, { timeToLive: null })

    const res = await fetch(put(
      url(getAddress())
    , pathname(`/streams/${id}`)
    , json({ timeToLive: null })
    ))

    expect(res.status).toBe(409)
    expect(await toText(res)).toBe('')
    expect(hasStream(id)).toBe(true)
  })

  describe('stream does not exist', () => {
    describe('timeToLive', () => {
      test('timeToLive is null', async () => {
        const id = 'id'
        const timeToLive = null

        const res = await fetch(put(
          url(getAddress())
        , pathname(`/streams/${id}`)
        , json<IStreamConfiguration>({ timeToLive })
        ))

        expect(res.status).toBe(204)
        expect(await toText(res)).toBe('')
        await delay(1000)
        expect(hasStream(id)).toBe(true)
      })

      test('timeToLive isnt null', async () => {
        const id = 'id'
        const timeToLive = 1000

        const res = await fetch(put(
          url(getAddress())
        , pathname(`/streams/${id}`)
        , json<IStreamConfiguration>({ timeToLive })
        ))

        expect(res.status).toBe(204)
        expect(await toText(res)).toBe('')
        await delay(900)
        expect(hasStream(id)).toBe(true)
        await delay(1100)
        expect(hasStream(id)).toBe(false)
      })
    })
  })
})
