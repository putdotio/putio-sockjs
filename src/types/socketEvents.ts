import { EVENT_TYPE } from './eventType'
import { IUser, Transfer } from '@putdotio/api-client'

export interface SocketEvents {
  Custom: {
    type: typeof EVENT_TYPE['CUSTOM']
    value: Record<string, unknown>
  }

  UserUpdate: {
    type: typeof EVENT_TYPE['USER_UPDATE']
    value: Partial<IUser>
  }

  TransfersCount: {
    type: typeof EVENT_TYPE['TRANSFERS_COUNT']
    value: number
  }

  TransfersClean: {
    type: typeof EVENT_TYPE['TRANSFERS_CLEAN']
  }

  TransferCreate: {
    type: typeof EVENT_TYPE['TRANSFER_CREATE']
    value: Transfer
  }

  TransferUpdate: {
    type: typeof EVENT_TYPE['TRANSFER_UPDATE']
    value: Transfer
  }

  TransferDelete: {
    type: typeof EVENT_TYPE['TRANSFER_DELETE']
    value: Transfer
  }
}

export type SocketEvent = SocketEvents[keyof SocketEvents]
