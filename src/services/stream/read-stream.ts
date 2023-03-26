import { FastifyPluginAsync } from 'fastify'
import { IAPI, StreamLocked, StreamNotFound } from '@src/contract.js'
import { idSchema } from '@src/schema.js'

export const routes: FastifyPluginAsync<{ API: IAPI }> = async (server, { API }) => {
  server.get<{
    Params: {
      id: string
    }
  }>(
    '/streams/:id'
  , {
      schema: {
        params: {
          id: idSchema
        }
      }
    }
  , (req, reply) => {
      const id = req.params.id

      try {
        const readable = API.readStream(id)

        reply.raw.setHeader('content-type', 'application/octet-stream')
        reply.raw.flushHeaders()
        readable.once('close', () => reply.raw.destroy())
        readable.pipe(reply.raw)
      } catch (e) {
        if (e instanceof StreamNotFound) return reply.status(404).send()
        if (e instanceof StreamLocked) return reply.status(409).send()

        throw e
      }
    }
  )
}
