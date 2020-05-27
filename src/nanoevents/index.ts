import { EventsMap, DefaultEvents, Emitter } from './types'

export * from './types'

export function createNanoEvents<
  Events extends EventsMap = DefaultEvents
>(): Emitter<Events> {
  return {
    events: {},

    emit(event, ...args) {
      for (let i of this.events[event] || []) {
        i(...args)
      }
    },

    on(event, cb) {
      ;(this.events[event] = this.events[event] || []).push(cb)
      return () =>
        (this.events[event] = this.events[event].filter((i) => i !== cb))
    },
  }
}
