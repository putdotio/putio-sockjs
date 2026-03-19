import { backOff } from "exponential-backoff";
import { createNanoEvents, type Emitter } from "nanoevents";
import SockJS from "sockjs-client";
import { DEFAULT_API_URL } from "./constants";
import createSocketEventHandler from "./socketEventHandler";
import type { EventMap, SocketEvent } from "./types";

export type PutioSocketClientConfig = { url?: string; token: string };

export const createClientFactoryWithDependencies =
  (createEventEmitter: () => Emitter<EventMap>, createWebSocket: (url: string) => WebSocket) =>
  (config: PutioSocketClientConfig) => {
    const { token } = config;
    const url = config.url || DEFAULT_API_URL;
    const eventEmitter = createEventEmitter();

    const reconnect = async () => {
      const reconnector = () =>
        new Promise<void>((resolve) => {
          socket = createWebSocket(url);

          createSocketEventHandler({
            token,
            socket,
            eventEmitter,
            reconnect: () => {
              reconnect();
              resolve();
            },
            onConnect: () => {
              eventEmitter.emit("reconnect");
              resolve();
            },
          });
        });

      await backOff(reconnector);
    };

    let socket = createWebSocket(url);
    createSocketEventHandler({
      token: config.token,
      socket,
      eventEmitter,
      reconnect,
      onConnect: () => {},
    });

    return {
      on: <K extends keyof EventMap>(event: K, cb: EventMap[K]) => eventEmitter.on(event, cb),
      send: (payload: SocketEvent) => socket.send(JSON.stringify(payload)),
      close: () => socket.close(),
    };
  };

const createClientFactory = () => {
  const createEventEmitter = () => createNanoEvents<EventMap>();
  const createWebSocket = (url: string) => new SockJS(url);
  return createClientFactoryWithDependencies(createEventEmitter, createWebSocket);
};

export const createPutioSocketClient = createClientFactory();

export type PutioSocketClient = ReturnType<typeof createPutioSocketClient>;
