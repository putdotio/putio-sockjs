import { createNanoEvents, type Emitter } from "nanoevents";
import SockJS from "sockjs-client";
import { DEFAULT_API_URL } from "./constants";
import createSocketEventHandler, { HEARTBEAT_INTERVAL_IN_SECONDS } from "./socketEventHandler";
import type { EventMap, SocketEvent } from "./types";

export type PutioSocketClientConfig = { url?: string; token: string };

// A connection must outlive one server heartbeat interval before it resets the
// retry budget, so a server that accepts and then drops connections still backs off.
const STABLE_CONNECTION_MS = HEARTBEAT_INTERVAL_IN_SECONDS * 1000;

export const createClientFactoryWithDependencies =
  (createEventEmitter: () => Emitter<EventMap>, createWebSocket: (url: string) => WebSocket) =>
  (config: PutioSocketClientConfig) => {
    const { token } = config;
    const url = config.url || DEFAULT_API_URL;
    const eventEmitter = createEventEmitter();

    let stopped = false;
    let reconnectAttempts = 0;
    let connectedAt: number | undefined;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let socket = createWebSocket(url);
    let handler: ReturnType<typeof createSocketEventHandler>;

    const stop = () => {
      stopped = true;
      clearTimeout(reconnectTimer);
      reconnectTimer = undefined;
    };

    const attach = (isReconnect: boolean) =>
      createSocketEventHandler({
        token,
        socket,
        eventEmitter,
        reconnect,
        onStop: stop,
        onConnect: () => {
          connectedAt = Date.now();
          if (isReconnect && !stopped) eventEmitter.emit("reconnect");
        },
      });

    const reconnect = () => {
      if (stopped || reconnectTimer !== undefined) return;
      if (connectedAt !== undefined && Date.now() - connectedAt >= STABLE_CONNECTION_MS)
        reconnectAttempts = 0;
      connectedAt = undefined;
      if (reconnectAttempts === 10) {
        stop();
        return;
      }
      // Preserve the previous backoff defaults while owning a cancellable timer.
      const delay = reconnectAttempts === 0 ? 0 : 100 * 2 ** (reconnectAttempts - 1);
      reconnectTimer = setTimeout(() => {
        reconnectTimer = undefined;
        if (stopped) return;
        reconnectAttempts++;
        try {
          socket = createWebSocket(url);
          handler = attach(true);
        } catch {
          eventEmitter.emit("error");
          reconnect();
        }
      }, delay);
    };

    handler = attach(false);

    return {
      on: <K extends keyof EventMap>(event: K, cb: EventMap[K]) => eventEmitter.on(event, cb),
      send: (payload: SocketEvent) => socket.send(JSON.stringify(payload)),
      close: () => {
        if (stopped) return;
        stop();
        handler.close();
      },
    };
  };

const createClientFactory = () => {
  const createEventEmitter = () => createNanoEvents<EventMap>();
  const createWebSocket = (url: string) => new SockJS(url);
  return createClientFactoryWithDependencies(createEventEmitter, createWebSocket);
};

export const createPutioSocketClient = createClientFactory();

export type PutioSocketClient = ReturnType<typeof createPutioSocketClient>;
