import { FastifyPluginAsync } from 'fastify'
import { dedent } from 'extra-tags'

export const routes: FastifyPluginAsync = async server => {
  server.get('/robots.txt', (req, reply) => {
    const text = dedent`
      User-agent: *
      Disallow: /
    `

    return reply
      .header('Content-Type', 'text/plain')
      .send(text)
  })
}
