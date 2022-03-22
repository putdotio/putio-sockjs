import { EVENT_TYPE } from './eventType'
import { SocketEvents } from './socketEvents'

export type EventMap = {
  [EVENT_TYPE.CONNECT]: () => void

  [EVENT_TYPE.DISCONNECT]: (event: CloseEvent) => void

  [EVENT_TYPE.ERROR]: (event: Event) => void

  [EVENT_TYPE.CUSTOM]: (value: SocketEvents['Custom']['value']) => void

  [EVENT_TYPE.USER_UPDATE]: (value: SocketEvents['UserUpdate']['value']) => void

  [EVENT_TYPE.FRIEND_REQUEST_COUNT]: (
    value: SocketEvents['FriendRequestCount']['value'],
  ) => void

  [EVENT_TYPE.TRANSFERS_COUNT]: (
    value: SocketEvents['TransfersCount']['value'],
  ) => void

  [EVENT_TYPE.TRANSFERS_CLEAN]: (
    value: SocketEvents['TransfersClean']['value'],
  ) => void

  [EVENT_TYPE.TRANSFER_CREATE]: (
    value: SocketEvents['TransferDelete']['value'],
  ) => void

  [EVENT_TYPE.TRANSFER_UPDATE]: (
    value: SocketEvents['TransferDelete']['value'],
  ) => void

  [EVENT_TYPE.TRANSFER_DELETE]: (
    value: SocketEvents['TransferDelete']['value'],
  ) => void
}
