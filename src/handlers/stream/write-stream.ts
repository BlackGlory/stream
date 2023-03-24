import { assert, isntNull } from 'https://esm.sh/@blackglory/prelude@0.3.1'
import { API } from '@apis/index.ts'
import { StreamLocked, StreamNotFound } from '@src/contract.ts'

export async function writeStream(req: Request, id: string): Promise<Response> {
  try {
    assert(isntNull(req.body), 'body is null')
    await API.writeStream(id, req.body)

    return new Response(null, { status: 204 })
  } catch (e) {
    if (e instanceof StreamNotFound) return new Response(null, { status: 404 })
    if (e instanceof StreamLocked) return new Response(null, { status: 409 })

    throw e
  }
}
