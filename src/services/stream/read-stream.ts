import { FastifyPluginAsync } from 'fastify'
import { IAPI, StreamLocked, StreamNotFound } from '@src/contract.js'
import { idSchema } from '@src/schema.js'
import { pipeline } from 'stream/promises'

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
        readable.once('error', e => {
          if (!reply.raw.destroyed) {
            reply.raw.destroy(e)
          }
        })
        reply.raw.once('error', e => {
          if (!readable.destroyed) [
            readable.destroy(e)
          ]
        })

        reply.raw.setHeader('content-type', 'application/octet-stream')
        reply.raw.flushHeaders()
        pipeline(readable, reply.raw).catch((e: Error) => {
          if (!reply.raw.destroyed) {
            reply.raw.destroy(e)
          }

          if (!readable.destroyed) [
            readable.destroy(e)
          ]
        })
      } catch (e) {
        if (e instanceof StreamNotFound) return reply.status(404).send()
        if (e instanceof StreamLocked) return reply.status(409).send()

        throw e
      }
    }
  )
}
