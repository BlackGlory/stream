import { FastifyPluginAsync } from 'fastify'
import { routes as createStreamRoutes } from './create-stream.js'
import { routes as writeStreamRoutes } from './write-stream.js'
import { routes as readStreamRoutes } from './read-stream.js'
import { IAPI } from '@src/contract.js'

export const routes: FastifyPluginAsync<{ API: IAPI }> = async (server, { API }) => {
  await server.register(createStreamRoutes, { API })
  await server.register(writeStreamRoutes, { API })
  await server.register(readStreamRoutes, { API })
}
