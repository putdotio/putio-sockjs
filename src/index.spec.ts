import * as PutioSocketClient from '.'

test('API Sanity Checks', () => {
  expect(PutioSocketClient).toMatchInlineSnapshot(`
    Object {
      "DEFAULT_API_URL": "https://socket.put.io/socket/sockjs",
      "EVENT_TYPE": Object {
        "APP_VERSION_UPDATED": "app_version_updated",
        "CONNECT": "connect",
        "CUSTOM": "custom",
        "DISCONNECT": "disconnect",
        "ERROR": "error",
        "FILE_CREATE": "file_create",
        "FILE_DELETE": "file_delete",
        "FILE_MOVE": "file_move",
        "FILE_UPDATE": "file_update",
        "FRIEND_REMOVE_RECEIVED": "friend_remove_received",
        "FRIEND_REMOVE_SENT": "friend_remove_sent",
        "FRIEND_REQUEST_APPROVE_RECEIVED": "friend_request_approve_received",
        "FRIEND_REQUEST_APPROVE_SENT": "friend_request_approve_sent",
        "FRIEND_REQUEST_COUNT": "friend_request_count",
        "FRIEND_REQUEST_DENY_RECEIVED": "friend_request_deny_received",
        "FRIEND_REQUEST_DENY_SENT": "friend_request_deny_sent",
        "FRIEND_REQUEST_RECEIVED": "friend_request_received",
        "MP4_UPDATE": "mp4_update",
        "PAYMENT_UPDATE": "payment_update",
        "TRANSFERS_CLEAN": "transfers_clean",
        "TRANSFERS_COUNT": "transfers_count",
        "TRANSFER_CREATE": "transfer_create",
        "TRANSFER_DELETE": "transfer_delete",
        "TRANSFER_UPDATE": "transfer_update",
        "USER_UPDATE": "user_update",
        "ZIP_CREATE": "zip_created",
      },
      "WEBSOCKET_CLOSEEVENT_CODE": Object {
        "NORMAL_CLOSURE": 1000,
        "UNAUTHORIZED": 4001,
      },
      "WEBSOCKET_ERROREVENT_CODE": Object {
        "CONNECTION_REFUSED": "ECONNREFUSED",
      },
      "createPutioSocketClient": [Function],
    }
  `)
})
