import { resetCache } from '@env/cache.js'
import { buildServer } from '@src/server.js'
import { UnpackedPromise } from 'hotypes'
import { deleteAllStreams } from '@dao/stream.js'
import { Readable } from 'stream'

let server: UnpackedPromise<ReturnType<typeof buildServer>>
let address: string

export function getAddress() {
  return address
}

export async function startService() {
  server = await buildServer()
  address = await server.listen()
}

export async function stopService() {
  await deleteAllStreams()
  await server.close()
  resetEnvironment()
}

export function resetEnvironment() {
  // reset memoize
  resetCache()
}

export function toNodeJSReadable<T>(
  iterable: Iterable<T> | AsyncIterable<T>
): Readable {
  return Readable.from(iterable)
}
