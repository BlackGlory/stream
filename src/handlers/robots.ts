import { dedent } from 'https://esm.sh/extra-tags@0.4.1'

export function robots(req: Request, url: URL): Response | undefined {
  if (url.pathname === '/robots.txt' && req.method === 'GET') {
    return new Response(
      dedent`
        User-agent: *
        Disallow: /
      `
    , {
        status: 200
      , headers: new Headers({
          'content-type': 'text/plain'
        })
      }
    )
  }
}
