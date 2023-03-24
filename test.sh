#/bin/bash
deno test \
  --allow-all \
  --trace-ops \
  ./tests/handlers/stream/read-stream.test.ts
