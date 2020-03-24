# `@putdotio/socket-client`

Socket client for [Put.io](https://put.io)

## Usage

```js
import PutioSocketClient from "@putdotio/socket-client";
const token = localStorage.getItem("oauth_token");

const client = new PutioSocketClient({
  debug: true,
  token
});

// Register event listeners
client
  .on(PutioSocketClient.CONNECT, () => console.log("Connected!"))
  .on(PutioSocketClient.FILE_CREATE, file =>
    console.log("File Created: ", file)
  )
  .on(PutioSocketClient.FILE_DELETE, file =>
    console.log("File Deleted: ", file)
  )
  .on(PutioSocketClient.DISCONNECT, () => console.log("Disconnected!"));

// Start connection (you can also set token via this method)
client.connect(token);

// Stop socket connection
client.disconnect();
```

## Options

|   Prop    |  Type  |                           Default Value                            | Description                              |
| :-------: | :----: | :----------------------------------------------------------------: | :--------------------------------------- |
| **debug** |  bool  |                               false                                | Debug mode                               |
| **token** | string |                                 ''                                 | Oauth token to use for socket connection |
|  **url**  | string | [socket.put.io/socket/sockjs](https://socket.put.io/socket/sockjs) | URL of the socket server                 |

## Events

All event identifiers are also [available as properties of a PutioSocketClient instance](./src/index.js#L7-L31), with upper snake case naming convention to provide more JS-friendly interface.

### Lifecycle

| Value      |          Payload           |
| :--------- | :------------------------: |
| connect    | PutioSocketClient Instance |
| disconnect | PutioSocketClient Instance |

### User

| Value       |               Payload                |
| :---------- | :----------------------------------: |
| user_update | UserInfo{} (just the updated fields) |

### Payment

| Value          |                 Payload                 |
| :------------- | :-------------------------------------: |
| payment_update | PaymentInfo{} (just the updated fields) |

### Files

| Value       |           Payload            |
| :---------- | :--------------------------: |
| file_create |          UserFile{}          |
| file_update |          UserFile{}          |
| file_delete |          UserFile{}          |
| mp4_update  | { id, status, percent_done } |
| zip_created |            { id }            |

### Transfers

| Value           |    Payload     |
| :-------------- | :------------: |
| transfers_count |     number     |
| transfers_clean |       -        |
| transfer_create | UserTransfer{} |
| transfer_update | UserTransfer{} |
| transfer_delete | UserTransfer{} |

### Friends

| Value                           |   Payload    |
| :------------------------------ | :----------: |
| friend_request_count            |    number    |
| friend_request_received         | UserFriend{} |
| friend_request_deny_sent        | UserFriend{} |
| friend_request_deny_received    | UserFriend{} |
| friend_request_approve_sent     | UserFriend{} |
| friend_request_approve_received | UserFriend{} |
| friend_remove_sent              | UserFriend{} |
| friend_remove_received          | UserFriend{} |

### Other

| Value  |   Payload   | Description                                   |
| :----- | :---------: | :-------------------------------------------- |
| custom | { message } | Custom messages such as "app_version_updated" |
