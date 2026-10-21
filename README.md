<div align="center">
  <p>
    <img src="https://static.put.io/images/putio-boncuk.png" width="72" alt="put.io boncuk">
  </p>

  <h1>putio-sockjs</h1>

  <p>SockJS client for real-time put.io events.</p>

  <p>
    <a href="https://github.com/putdotio/putio-sockjs/actions/workflows/ci.yml?query=branch%3Amain" style="text-decoration:none;"><img src="https://img.shields.io/github/actions/workflow/status/putdotio/putio-sockjs/ci.yml?branch=main&style=flat&label=ci&colorA=000000&colorB=000000" alt="CI"></a>
    <a href="https://www.npmjs.com/package/@putdotio/socket-client" style="text-decoration:none;"><img src="https://img.shields.io/npm/v/%40putdotio%2Fsocket-client?style=flat&colorA=000000&colorB=000000" alt="npm version"></a>
    <a href="https://github.com/putdotio/putio-sockjs/blob/main/LICENSE" style="text-decoration:none;"><img src="https://img.shields.io/github/license/putdotio/putio-sockjs?style=flat&colorA=000000&colorB=000000" alt="license"></a>
  </p>
</div>

## Installation

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

// Later, during teardown:
unsubscribe();
client.close();
```

## Connection Lifecycle

Call `client.close()` during teardown. Closing is idempotent and permanently stops
heartbeat checks and pending reconnects for that client. Create a new client to
connect again.

Transient closures trigger up to 10 reconnect attempts: the first is immediate,
then delays start at 100 ms and double after each failed attempt. A successful
connection emits `connect` followed by `reconnect`; it resets the retry budget
only once it has stayed open for 10 seconds, so a server that accepts and then
drops connections still backs off and exhausts the attempts.
Normal closure (1000), server error (1011), and application codes from 4000 up,
such as unauthorized (4001), stop the client without retrying.

## Events

`EVENT_TYPE` names every socket event, and `SocketEvents` maps each one to its
payload type:

```ts
import { EVENT_TYPE, type SocketEvents } from "@putdotio/socket-client";

const onTransferUpdate = (transfer: SocketEvents["TransferUpdate"]["value"]) => {
  console.log(transfer.id, transfer.status);
};

client.on(EVENT_TYPE.TRANSFER_UPDATE, onTransferUpdate);
```

## Docs

- [Contributing](./CONTRIBUTING.md)
- [Distribution](./docs/distribution.md)
- [Security policy](https://github.com/putdotio/.github/blob/main/SECURITY.md)

## License

This project is available under the [MIT License](./LICENSE).
