import { FastifyPluginAsync } from 'fastify'
import { IAPI, IConfig, StreamLocked } from '@src/contract.js'
import { idSchema } from '@src/schema.js'

export const routes: FastifyPluginAsync<{ API: IAPI }> = async (server, { API }) => {
  server.put<{
    Params: {
      id: string
    }
    Body: IConfig
  }>(
    '/streams/:id'
  , {
      schema: {
        params: {
          id: idSchema
        }
      , body: {
          timeToLive: {
            type: ['integer', 'null']
          }
        }
      , response: {
          204: { type: 'null' }
        }
      }
    }
  , async (req, reply) => {
      const id = req.params.id
      const config = req.body

      try {
        API.createStream(id, config)

        return reply
          .status(204)
          .send()
      } catch (e) {
        if (e instanceof StreamLocked) return reply.status(409).send()

        throw e
      }
    }
  )
}
