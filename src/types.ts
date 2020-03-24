export const EVENT_TYPES = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CUSTOM: 'custom',
  USER_UPDATE: 'user_update',
  PAYMENT_UPDATE: 'payment_update',
  FILE_CREATE: 'file_create',
  FILE_UPDATE: 'file_update',
  FILE_DELETE: 'file_delete',
  MP4_UPDATE: 'mp4_update',
  ZIP_CREATE: 'zip_created',
  FRIEND_REQUEST_COUNT: 'friend_request_count',
  FRIEND_REQUEST_RECEIVED: 'friend_request_received',
  FRIEND_REQUEST_DENY_SENT: 'friend_request_deny_sent',
  FRIEND_REQUEST_DENY_RECEIVED: 'friend_request_deny_received',
  FRIEND_REQUEST_APPROVE_SENT: 'friend_request_approve_sent',
  FRIEND_REQUEST_APPROVE_RECEIVED: 'friend_request_approve_received',
  FRIEND_REMOVE_SENT: 'friend_remove_sent',
  FRIEND_REMOVE_RECEIVED: 'friend_remove_received',
  TRANSFERS_COUNT: 'transfers_count',
  TRANSFERS_CLEAN: 'transfers_clean',
  TRANSFER_CREATE: 'transfer_create',
  TRANSFER_UPDATE: 'transfer_update',
  TRANSFER_DELETE: 'transfer_delete',
  APP_VERSION_UPDATED: 'app_version_updated',
} as const

namespace ServerEvents {
  export type UserUpdateEvent = {
    type: typeof EVENT_TYPES['USER_UPDATE']
    payload: {
      account_active: boolean
    }
  }
}

export type ServerEvent = ServerEvents.UserUpdateEvent

export type EventsMap = {
  [EVENT_TYPES.CONNECT]: () => void
  [EVENT_TYPES.DISCONNECT]: () => void
  [EVENT_TYPES.USER_UPDATE]: (
    payload: ServerEvents.UserUpdateEvent['payload'],
  ) => void
}
