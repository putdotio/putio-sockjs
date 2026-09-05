import { WEBSOCKET_CLOSEEVENT_CODE, WEBSOCKET_ERROREVENT_CODE } from "./constants";
import type { Emitter } from "nanoevents";
import { EVENT_TYPE } from "./types";
import type { EventMap, SocketEvent } from "./types";

const HEARTBEAT_INTERVAL_IN_SECONDS = 10;
const HEARTBEAT_LATENCY_ASSUMPTION_IN_SECONDS = 2;
const HEARTBEAT_TIMER =
  (HEARTBEAT_INTERVAL_IN_SECONDS + HEARTBEAT_LATENCY_ASSUMPTION_IN_SECONDS) * 1000;

const createSocketEventHandler = ({
  token,
  socket,
  eventEmitter,
  reconnect,
  onConnect,
  onStop = () => {},
}: {
  token: string;
  socket: WebSocket;
  eventEmitter: Emitter<EventMap>;
  reconnect: () => void;
  onConnect: () => void;
  onStop?: () => void;
}) => {
  let active = true;
  let pingTimeout: ReturnType<typeof setTimeout> | undefined;

  const setPingTimeout = () => {
    if (!active) return;
    clearTimeout(pingTimeout);
    pingTimeout = setTimeout(closeConnectionAndReconnect, HEARTBEAT_TIMER);
  };

  const cleanup = () => {
    active = false;
    clearTimeout(pingTimeout);
    socket.removeEventListener("heartbeat", setPingTimeout);
    socket.onopen = null;
    socket.onclose = null;
    socket.onerror = null;
    socket.onmessage = null;
  };

  const close = () => {
    if (!active) return;
    cleanup();
    // Closing SockJS is asynchronous. Keep only its final disconnect event.
    socket.onclose = (event) => {
      socket.onclose = null;
      eventEmitter.emit(EVENT_TYPE.DISCONNECT, event);
    };
    if (socket.readyState < 2) socket.close();
  };

  const closeConnectionAndReconnect = () => {
    if (!active) return;
    close();
    reconnect();
  };

  socket.onopen = () => {
    if (!active) return;
    setPingTimeout();
    socket.send(token);
    eventEmitter.emit(EVENT_TYPE.CONNECT);
    if (active) onConnect();
  };

  socket.onclose = (event) => {
    if (!active) return;
    cleanup();
    eventEmitter.emit(EVENT_TYPE.DISCONNECT, event);

    if (
      event.code > 1000 &&
      event.code < 4000 &&
      event.code !== WEBSOCKET_CLOSEEVENT_CODE.SERVER_ERROR
    )
      reconnect();
    else onStop();
  };

  socket.onerror = (event) => {
    if (!active) return;
    eventEmitter.emit(EVENT_TYPE.ERROR);
    if ("code" in event && event.code === WEBSOCKET_ERROREVENT_CODE.CONNECTION_REFUSED) {
      closeConnectionAndReconnect();
    }
  };

  socket.onmessage = (e) => {
    if (!active) return;
    try {
      const data = JSON.parse(e.data) as SocketEvent;
      eventEmitter.emit(data.type, data.value);
    } catch (e) {
      console.warn(`Could not deserialize message payload: `, e);
    }
  };

  socket.addEventListener("heartbeat", setPingTimeout);

  return { close };
};

export default createSocketEventHandler;
