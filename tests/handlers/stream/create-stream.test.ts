import { assertEquals } from 'https://deno.land/std@0.158.0/testing/asserts.ts'
import { describe, it, beforeEach, afterEach } from 'https://deno.land/std@0.158.0/testing/bdd.ts'
import { fetch } from 'https://esm.sh/extra-fetch@4.0.4'
import { put } from 'https://esm.sh/extra-request@8.3.0'
import * as transformers from 'https://esm.sh/extra-request@8.3.0/transformers'
import { toText } from 'https://esm.sh/extra-response@0.5.1'
import { API } from '@apis/index.ts'
import { startService, stopService, getAddress } from '@test/utils.ts'

beforeEach(startService)
afterEach(stopService)

describe('create stream', () => {
  it('stream exists', async () => {
    const id = 'id'
    API.createStream(id, null)

    const res = await fetch(put(
      transformers.url(getAddress())
    , transformers.pathname(`/streams/${id}`)
    , transformers.json({ timeToLive: null })
    ))

    assertEquals(res.status, 409)
    assertEquals(await toText(res), '')
    assertEquals(API.hasStream(id), true)
  })

  it('stream does not exist', async () => {
    const id = 'id'

    const res = await fetch(put(
      transformers.url(getAddress())
    , transformers.pathname(`/streams/${id}`)
    , transformers.json({ timeToLive: null })
    ))

    assertEquals(res.status, 204)
    assertEquals(await toText(res), '')
    assertEquals(API.hasStream(id), true)
  })
})
