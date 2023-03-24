export function health(req: Request, url: URL): Response | undefined {
  if (url.pathname === '/health' && req.method === 'GET') {
    return new Response('OK', { status: 200 })
  }
}
