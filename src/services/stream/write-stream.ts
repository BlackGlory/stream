import { FastifyPluginAsync } from 'fastify'
import { IAPI, StreamLocked, StreamNotFound } from '@src/contract.js'
import { idSchema } from '@src/schema.js'

export const routes: FastifyPluginAsync<{ API: IAPI }> = async (server, { API }) => {
  server.addContentTypeParser('application/octet-stream', (req, payload, done) => {
    done(null)
  })

  server.post<{
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
  , async (req, reply) => {
      const id = req.params.id

      try {
        await API.writeStream(id, req.raw)
        return reply
          .status(204)
          .send()
      } catch (e) {
        if (e instanceof StreamNotFound) return reply.status(404).send()
        if (e instanceof StreamLocked) return reply.status(409).send()

        throw e
      }
    }
  )
}
