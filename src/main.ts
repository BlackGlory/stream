import { HOST, PORT } from '@env/index.ts'
import { startServer } from './server.ts'

startServer(HOST(), PORT())
