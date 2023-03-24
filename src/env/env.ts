import { isNumber } from 'https://esm.sh/extra-utils@5.1.0'
import { ValueGetter } from 'https://esm.sh/value-getter@0.3.0'
import { Getter } from 'https://esm.sh/justypes@4.2.0'
import { getCache } from '@env/cache.ts'

export const HOST: Getter<string> =
  env('STREAM_HOST')
    .default('localhost')
    .memoize(getCache)
    .get()

export const PORT: Getter<number> =
  env('STREAM_PORT')
    .convert(toInteger)
    .default(8080)
    .memoize(getCache)
    .get()

function env(name: string): ValueGetter<string | undefined> {
  return new ValueGetter(name, () => Deno.env.get(name))
}

function toInteger(val: string | number | undefined ): number | undefined {
  if (isNumber(val)) return val
  if (val) return Number.parseInt(val, 10)
}
