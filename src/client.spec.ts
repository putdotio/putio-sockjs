import { mock } from 'jest-mock-extended'
import { Emitter } from 'nanoevents'
import { EventMap, SocketEvents } from './types'
import { createClientFactoryWithDependencies } from './client'

describe('PutioSocketClient with mocked dependencies', () => {
  const mockConfig = { url: 'test.io', token: 'TOKEN' }
  const mockedEmitter = mock<Emitter<EventMap>>()
  const mockedWebSocket = mock<WebSocket>()
  const createMockedEmiter = jest.fn(() => mockedEmitter)
  const createMockedWebSocket = jest.fn((_: string) => mockedWebSocket)
  const createClient = createClientFactoryWithDependencies(
    createMockedEmiter,
    createMockedWebSocket,
  )

  describe('commands', () => {
    const client = createClient(mockConfig)
    afterEach(jest.clearAllMocks)

    it('sends close command', () => {
      client.close()
      expect(mockedWebSocket.close).toBeCalled()

      const event = new CloseEvent('close')
      mockedWebSocket.onclose && mockedWebSocket.onclose(event)

      expect(mockedEmitter.emit).toBeCalledWith('disconnect', event)
    })

    it('sends send command', () => {
      const message: SocketEvents.Custom = {
        type: 'custom',
        value: { foo: 'bar' },
      }

      client.send(message)
      expect(mockedWebSocket.send).toBeCalledWith(JSON.stringify(message))
    })
  })
})
