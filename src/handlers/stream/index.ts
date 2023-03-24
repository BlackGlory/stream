import { Awaitable } from 'https://esm.sh/@blackglory/prelude@0.3.1'
import { createStream } from './create-stream.ts'
import { readStream } from './read-stream.ts'
import { writeStream } from './write-stream.ts'

const urlPattern = new URLPattern({
  pathname: '/streams/:id'
})

export function stream(req: Request, url: URL): Awaitable<Response | undefined> {
  const match = urlPattern.exec(url)
  if (match) {
    const id = match.pathname.groups.id

    switch (req.method) {
      case 'PUT': return createStream(req, id)
      case 'GET': return readStream(req, id)
      case 'POST': return writeStream(req, id)
    }
  }
}
