import { createPutioSocketClient } from './client'

describe('PutioSocketClient', () => {
  it('🏆 connects without exploding 🏆', done => {
    const client = createPutioSocketClient({ token: 'TOKEN' })

    client.on('connect', () => {
      client.close()
      done()
    })
  })
})
