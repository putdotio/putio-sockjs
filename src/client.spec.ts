import { mock } from 'jest-mock-extended'
import { Emitter } from 'nanoevents'
import { EventMap, SocketEvents } from './types'
import {
  createClientFactoryWithDependencies,
  PutioSocketClient,
} from './client'
// import { WEBSOCKET_ERROREVENT_CODE } from './constants'

describe('PutioSocketClient with mocked dependencies', () => {
  let client: PutioSocketClient
  const mockConfig = { url: 'test.io', token: 'TOKEN' }

  const mockedEmitter = mock<Emitter<EventMap>>()
  const createMockedEmiter = jest.fn(() => mockedEmitter)

  const mockedWebSocket = mock<WebSocket>()
  const createMockedWebSocket = jest.fn((_: string) => mockedWebSocket)

  const createClient = createClientFactoryWithDependencies(
    createMockedEmiter,
    createMockedWebSocket,
  )

  describe('commands', () => {
    beforeEach(() => (client = createClient(mockConfig)))
    afterEach(jest.clearAllMocks)

    it('handles send command', () => {
      const message: SocketEvents['Custom'] = {
        type: 'custom',
        value: { foo: 'bar' },
      }

      client.send(message)
      expect(mockedWebSocket.send).toBeCalledWith(JSON.stringify(message))
    })

    it('handles close command', () => {
      client.close()
      expect(mockedWebSocket.close).toBeCalled()

      const event = new CloseEvent('close')
      mockedWebSocket.onclose && mockedWebSocket.onclose(event)
      expect(mockedEmitter.emit).toBeCalledWith('disconnect', event)
    })
  })

  describe.only('reconnect flow', () => {
    beforeEach(() => (client = createClient(mockConfig)))
    afterEach(jest.clearAllMocks)

    it('tries to reconnect after close and error: connection refused events', async () => {
      expect(createMockedEmiter).toHaveBeenCalledTimes(1)
      expect(createMockedWebSocket).toHaveBeenCalledTimes(1)

      mockedWebSocket.onopen && mockedWebSocket.onopen(new Event('Connected'))
      expect(mockedEmitter.emit).toBeCalledWith('connect')

      const SECOND_EVENT_EMITTER = mock<Emitter<EventMap>>()
      createMockedEmiter.mockImplementation(() => SECOND_EVENT_EMITTER)

      const SECOND_WEB_SOCKET = mock<WebSocket>()
      createMockedWebSocket.mockImplementation(() => SECOND_WEB_SOCKET)

      console.log('closing')
      mockedWebSocket.onclose &&
        mockedWebSocket.onclose({ code: 1001 } as CloseEvent)
      console.log('closed')

      expect(createMockedEmiter).toHaveBeenCalledTimes(2)
      expect(createMockedWebSocket).toHaveBeenCalledTimes(2)

      // SECOND_WEB_SOCKET.onopen &&
      // SECOND_WEB_SOCKET.onopen(new Event('Connected'))

      mockedWebSocket.onclose &&
        mockedWebSocket.onclose({ code: 1001 } as CloseEvent)

      expect(createMockedWebSocket).toHaveBeenCalledTimes(3)

      // mockedWebSocket.onopen && mockedWebSocket.onopen(new Event('Connected'))
      // expect(mockedEmitter.emit).toBeCalledWith('connect')

      // expect(createMockedWebSocket).toHaveBeenCalledTimes(2)

      // mockedWebSocket.onerror &&
      //   mockedWebSocket.onerror({
      //     code: WEBSOCKET_ERROREVENT_CODE.CONNECTION_REFUSED,
      //   } as any)

      // expect(createMockedWebSocket).toHaveBeenCalledTimes(3)

      // mockedWebSocket.onclose &&
      //   mockedWebSocket.onclose({ code: 1005 } as CloseEvent)

      // expect(createMockedWebSocket).toHaveBeenCalledTimes(4)

      // mockedWebSocket.onopen && mockedWebSocket.onopen(new Event('Connected'))
      // expect(mockedEmitter.emit).toBeCalledWith('connect')

      // expect(createMockedWebSocket).toHaveBeenCalledTimes(4)
    })
  })
})
