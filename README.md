<div align="center">
  <p>
    <img src="https://static.put.io/images/putio-boncuk.png" width="72" alt="put.io boncuk">
  </p>

  <h1>putio-sockjs</h1>

  <p>SockJS client for real-time put.io events.</p>

  <p>
    <a href="https://github.com/putdotio/putio-sockjs/actions/workflows/ci.yml?query=branch%3Amaster" style="text-decoration:none;"><img src="https://img.shields.io/github/actions/workflow/status/putdotio/putio-sockjs/ci.yml?branch=master&style=flat&label=ci&colorA=000000&colorB=000000" alt="CI"></a>
    <a href="https://www.npmjs.com/package/@putdotio/socket-client" style="text-decoration:none;"><img src="https://img.shields.io/npm/v/%40putdotio%2Fsocket-client?style=flat&colorA=000000&colorB=000000" alt="npm version"></a>
    <a href="https://github.com/putdotio/putio-sockjs/blob/master/LICENSE" style="text-decoration:none;"><img src="https://img.shields.io/github/license/putdotio/putio-sockjs?style=flat&colorA=000000&colorB=000000" alt="license"></a>
  </p>
</div>

## Installation

Install with npm:

```bash
npm install @putdotio/socket-client
```

## Quick Start

```ts
import { createPutioSocketClient, EVENT_TYPE } from "@putdotio/socket-client";

const client = createPutioSocketClient({
  token: process.env.PUTIO_TOKEN!,
});

const unsubscribe = client.on(EVENT_TYPE.TRANSFER_UPDATE, (payload) => {
  console.log(payload);
});

client.on(EVENT_TYPE.CONNECT, () => {
  client.send({
    type: "custom",
    value: { hello: "world" },
  });
});
```

## Events

The package exports typed event names and payload maps for the socket stream:

```ts
import { EVENT_TYPE, type SocketEvents } from "@putdotio/socket-client";

const event: SocketEvents["TransferUpdate"] = {
  type: EVENT_TYPE.TRANSFER_UPDATE,
  value: {
    id: 1,
  },
};
```

## Docs

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [SECURITY.md](./SECURITY.md)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE)
