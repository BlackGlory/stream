# Stream
提供基于HTTP的流数据传输中介服务.

## Install
### 从源代码运行
```sh
git clone https://github.com/BlackGlory/stream
cd stream
yarn install
yarn build
yarn bundle
yarn --silent start
```

### 从源代码构建
```sh
git clone https://github.com/BlackGlory/stream
cd stream
yarn install
yarn docker:build
```

### Recipes
#### docker-compose.yml
```yaml
version: '3.8'

services:
  pubsub:
    image: 'blackglory/stream'
    restart: always
    ports:
      - '8080:8080'
```

## API
### create stream
`PUT /streams/<id>`

创建一个流.

发送JSON:
```ts
{
  // 设置流的存活时间, 以流创建起开始计时, 超时会自动关闭.
  // 如果流被删除时正在被使用, 流的写入者和读取者都会被断开连接.
  // null表示不限制.
  timeToLive: number | null
}
```

每个流都是双向的, 可以上传也可以下载.
在流的生命周期中, 创建, 写入, 读取操作各自只能被执行一次.

如果流已经被创建, 返回409.

#### Example
##### curl
```sh
curl \
  --request PUT \
  --header "Content-Type: application/json" \
  --data "$payload" \
  "http://localhost:8080/streams/$id"
```

##### JavaScript
```js
await fetch(`http://localhost:8080/streams/${id}`, {
  method: 'PUT'
, headers: {
    'Content-Type': 'application/json'
  }
, body: JSON.stringify(payload)
})
```

### write stream
`POST /streams/<id>`

写入流.

如果流不存在, 返回404.
如果流已经被其他客户端抢先写入, 返回409.

#### Example
##### curl
```sh
curl \
  --request POST \
  --data-binary "$payload" \
  "http://localhost:8080/streams/$id"
```

##### JavaScript
```js
await fetch(`http://localhost:8080/streams/${id}`, {
  method: 'POST'
, headers: {
    'Content-Type': 'application/octet-stream'
  }
, body: payload
})
```

### read stream
`GET /streams/<id>`

读取流.

如果流不存在, 返回404.
如果流已经被其他客户端抢先读取, 返回409.

#### Example
##### curl
```sh
curl --no-buffer \
  "http://localhost:8080/streams/$id"
```

##### JavaScript
```js
await fetch(`http://localhost:8080/streams/${id}`)
  .then(res => res.body)
```

## 环境变量
### `STREAM_HOST`, `STREAM_PORT`
通过环境变量`STREAM_HOST`和`STREAM_PORT`决定服务器监听的地址和端口,
默认值为`localhost`和`8080`.

## 客户端
- JavaScript/TypeScript(Node.js, Browser): <https://github.com/BlackGlory/stream-js>
