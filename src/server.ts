import fastify from 'fastify'
import cors from '@fastify/cors'
import { routes as stream } from '@services/stream/index.js'
import { routes as robots } from '@services/robots/index.js'
import { routes as health } from '@services/health/index.js'
import { NODE_ENV, NodeEnv } from '@env/index.js'
import { API } from '@apis/index.js'
import { isntUndefined, isString } from '@blackglory/prelude'
import { assert } from '@blackglory/errors'
import semver from 'semver'
import { getPackageFilename } from '@utils/get-package-filename.js'
import { readJSONFile } from 'extra-filesystem'

type LoggerLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export async function buildServer() {
  const KiB = 1024
  const MiB = 1024 * KiB
  const GiB = 1024 * MiB

  const pkg = await readJSONFile<{ version: `${number}.${number}.${number}` }>(
    getPackageFilename()
  )

  const server = fastify({
    logger: getLoggerOptions()
  , maxParamLength: 600
  , bodyLimit: 1 * GiB
  , forceCloseConnections: true
  })

  // 全局移除默认的`text/plain`解析器.
  server.removeContentTypeParser('text/plain')

  server.addHook('onRequest', async (req, reply) => {
    // eslint-disable-next-line
    reply.header('Cache-Control', 'private, no-cache')
  })
  server.addHook('onRequest', async (req, reply) => {
    const acceptVersion = req.headers['accept-version']
    if (isntUndefined(acceptVersion)) {
      assert(isString(acceptVersion), 'Accept-Version must be string')
      if (!semver.satisfies(pkg.version, acceptVersion)) {
        return reply.status(400).send()
      }
    }
  })

  await server.register(cors, { origin: true })
  await server.register(stream, { API })
  await server.register(robots)
  await server.register(health)

  return server
}

function getLoggerOptions(): { level: LoggerLevel } | boolean {
  switch (NODE_ENV()) {
    case NodeEnv.Test: return false
    case NodeEnv.Production: return { level: 'error' }
    case NodeEnv.Development: return { level: 'trace' }
    default: return false
  }
}
