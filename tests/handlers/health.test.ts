import { assertEquals } from 'https://deno.land/std@0.158.0/testing/asserts.ts'
import { it, beforeEach, afterEach } from 'https://deno.land/std@0.158.0/testing/bdd.ts'
import { fetch } from 'https://esm.sh/extra-fetch@4.0.4'
import { get } from 'https://esm.sh/extra-request@8.3.0'
import * as transformers from 'https://esm.sh/extra-request@8.2.0/transformers'
import { toText } from 'https://esm.sh/extra-response@0.5.1'
import { startService, stopService, getAddress } from '@test/utils.ts'

beforeEach(startService)
afterEach(stopService)

it('health', async () => {
  const res = await fetch(get(
    transformers.url(getAddress())
  , transformers.pathname('/health')
  ))

  assertEquals(res.status, 200)
  assertEquals(await toText(res), 'OK')
})
