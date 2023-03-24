import { API } from '@apis/index.ts'
import { StreamLocked, StreamNotFound } from '@src/contract.ts'
import { toReadableStream } from 'https://esm.sh/extra-stream@0.2.0'

export function readStream(req: Request, id: string): Response {
  try {
    const stream = toReadableStream(API.readStream(id))

    return new Response(stream, {
      headers: {
        'content-type': 'application/octet-stream'
      }
    })
  } catch (e) {
    if (e instanceof StreamNotFound) return new Response(null, { status: 404 })
    if (e instanceof StreamLocked) return new Response(null, { status: 409 })

    throw e
  }
}
