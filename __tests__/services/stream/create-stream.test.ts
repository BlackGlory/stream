import { fetch } from 'extra-fetch'
import { put } from 'extra-request'
import { url, pathname, json } from 'extra-request/transformers'
import { toText } from 'extra-response'
import { API } from '@apis/index.js'
import { startService, stopService, getAddress } from '@test/utils.js'
import { hasStream } from '@dao/stream.js'

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

  test('stream does not exist', async () => {
    const id = 'id'

    const res = await fetch(put(
      url(getAddress())
    , pathname(`/streams/${id}`)
    , json({ timeToLive: null })
    ))

    expect(res.status).toBe(204)
    expect(await toText(res)).toBe('')
    expect(hasStream(id)).toBe(true)
  })
})
