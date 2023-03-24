import { notFound } from '@handlers/not-found.ts'
import { health } from '@handlers/health.ts'
import { robots } from '@handlers/robots.ts'
import { stream } from '@handlers/stream/index.ts'
import { mapAsync, findAsync } from 'https://esm.sh/iterable-operator@4.0.3'
import { pipeAsync, isntUndefined } from 'https://esm.sh/extra-utils@5.1.0'

export async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)

  const res = await pipeAsync(
    [health, robots, stream]
  , handlers => {
      const responses: AsyncIterableIterator<Response | undefined> = mapAsync(
        handlers
      , handler => handler(req, url)
      )
      return responses
    }
  , responses => findAsync(responses, response => isntUndefined(response))
  )

  if (res) {
    return res
  } else {
    return notFound(req, url)
  }
}
