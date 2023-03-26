import { startService, stopService, getAddress } from '@test/utils.js'
import { fetch } from 'extra-fetch'
import { get } from 'extra-request'
import { url, pathname } from 'extra-request/transformers'
import { toText } from 'extra-response'

beforeEach(startService)
afterEach(stopService)

describe('robots', () => {
  describe('GET /robots.txt', () => {
    it('200', async () => {
      const res = await fetch(get(
        url(getAddress())
      , pathname('/robots.txt')
      ))

      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toBe('text/plain')
      expect(await toText(res)).toBe(
        'User-agent: *' + '\n'
      + 'Disallow: /'
      )
    })
  })
})
