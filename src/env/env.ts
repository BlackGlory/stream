import { ValueGetter } from 'value-getter'
import { Getter } from '@blackglory/prelude'
import { getCache } from '@env/cache.js'

export enum NodeEnv {
  Test
, Development
, Production
}

export const NODE_ENV: Getter<NodeEnv | undefined> =
  env('NODE_ENV')
    .convert(val => {
      switch (val) {
        case 'test': return NodeEnv.Test
        case 'development': return NodeEnv.Development
        case 'production': return NodeEnv.Production
      }
    })
    .memoize(getCache)
    .get()

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
  return new ValueGetter(name, () => process.env[name])
}

function toInteger(val: string | undefined): number | undefined {
  if (val) return Number.parseInt(val, 10)
}
