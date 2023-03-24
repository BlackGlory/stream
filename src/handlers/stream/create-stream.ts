import { isNumber, isNull, isPlainObject } from 'https://esm.sh/@blackglory/prelude@0.3.1'
import { API } from '@apis/index.ts'
import { StreamLocked } from '@src/contract.ts'

interface IConfig {
  timeToLive: number | null
}

export async function createStream(req: Request, id: string): Promise<Response> {
  try {
    const config = await req.json()
    if (isConfig(config)) {
      API.createStream(id, config.timeToLive)
      return new Response(null, { status: 204 })
    } else {
      return new Response('payload is not a valid config', { status: 400 })
    }
  } catch (e) {
    if (e instanceof StreamLocked) return new Response(null, { status: 409 })

    throw e
  }
}

function isConfig(val: unknown): val is IConfig {
  return isPlainObject(val)
      && (
           'timeToLive' in val && (
             isNumber(val.timeToLive) ||
             isNull(val.timeToLive)
           )
         )
}
