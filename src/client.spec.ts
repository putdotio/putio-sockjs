import { mock } from 'jest-mock-extended'
import { Emitter } from 'nanoevents'
import { EventsMap } from './types'
import {
  PutioSocketClient,
  createPutioSocketClient,
  createPutioSocketClientWithDependencies,
} from './client'

const MOCK_TOKEN = 'TOKEN'

describe('createPutioSocketClient', () => {
  it('🏆runs without crashing 🏆', () => {
    const createClient = createPutioSocketClient()
    const client = createClient()
    client.connect(MOCK_TOKEN)
    expect(client).toBeTruthy()
  })
})

describe('createPutioSocketClientWithDependencies', () => {
  const mockedEmitter = mock<Emitter<EventsMap>>()
  const mockedWebSocket = mock<WebSocket>()

  const createMockedEmiter = jest.fn(() => mockedEmitter)
  const createMockedWebSocket = jest.fn((_: string) => mockedWebSocket)

  const createClient = createPutioSocketClientWithDependencies(
    createMockedEmiter,
    createMockedWebSocket,
  )

  afterEach(jest.clearAllMocks)

  describe('creation step', () => {
    it('handles custom options parameter', () => {
      const client = createClient({ url: 'example.com' })
      client.connect(MOCK_TOKEN)
      expect(createMockedWebSocket).toBeCalledWith('example.com')
    })
  })

  describe('connection and message steps', () => {
    let client: PutioSocketClient

    beforeEach(() => {
      client = createClient()
      client.connect(MOCK_TOKEN)
    })

    it('handles connect', () => {
      mockedWebSocket.onopen(new Event(''))
      expect(mockedWebSocket.send).toBeCalledWith(MOCK_TOKEN)
      expect(mockedEmitter.emit).toBeCalledWith('connect')
    })

    it('handles disconnect', () => {
      client.disconnect()
      expect(mockedWebSocket.close).toBeCalled()

      mockedWebSocket.onclose(new CloseEvent(''))
      expect(mockedEmitter.emit).toBeCalledWith('disconnect')
    })

    it('parses valid messages', () => {
      const event = new MessageEvent('user_update', {
        data: JSON.stringify({
          type: 'user_update',
          payload: { account_active: false },
        }),
      })

      mockedWebSocket.onmessage(event)

      expect(mockedEmitter.emit).toBeCalledWith('user_update', {
        account_active: false,
      })
    })

    it('handles invalid messages', () => {
      jest.spyOn(console, 'warn').mockImplementationOnce(() => null)

      const event = new MessageEvent('invalid_event', {
        data: JSON.stringify(null),
      })

      mockedWebSocket.onmessage(event)

      expect(mockedEmitter.emit).not.toBeCalled()
    })
  })
})
