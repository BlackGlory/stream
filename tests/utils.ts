import { API } from '@apis/index.ts'
import { startServer } from '@src/server.ts'

let closeServer: () => Promise<void>
let port: number

export async function startService(): Promise<void> {
  ({ port, closeServer } = await startServer('localhost'))
}

export async function stopService(): Promise<void> {
  await API.clearStreams()
  await closeServer()
}

export function getAddress(): string {
  return `http://localhost:${port}`
}
