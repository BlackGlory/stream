import { serve } from 'https://deno.land/std@0.158.0/http/server.ts'
import { AbortController } from 'https://esm.sh/extra-abort@0.3.2'
import { Deferred } from 'https://esm.sh/extra-promise@6.0.5'
import { handler } from '@handlers/index.ts'

export async function startServer(hostname: string, port?: number): Promise<{
  port: number
  closeServer: () => Promise<void>
}> {
  const controller = new AbortController()

  const portPromise = new Deferred<number>()
  const closePromise = serve(handler, {
    hostname
  , port
  , signal: controller.signal
  , onListen({ port }) {
      portPromise.resolve(port)
    }
  })

  return {
    port: await portPromise
  , async closeServer() {
      controller.abort()
      await closePromise
    }
  }
}
