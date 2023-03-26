import { fileURLToPath } from 'url'

export default {
  target: 'node'
, mode: 'none'
, node: {
    global: true,
    __filename: true,
    __dirname: true,
  }
, entry: './lib/index.js'
, output: {
    path: fileURLToPath(new URL('dist', import.meta.url))
  , filename: 'index.cjs'
  }
, externals: {
    'long': 'commonjs long'
  , 'app-root-path': 'commonjs app-root-path'
  , 'better-sqlite3': 'commonjs better-sqlite3'
  }
}
