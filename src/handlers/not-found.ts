export function notFound(req: Request, url: URL): Response {
  return new Response('Not Found', { status: 404 })
}
