import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { createNanoEvents } from "nanoevents";
import createSocketEventHandler from "./socketEventHandler";
import type { EventMap } from "./types";
import { TestSocket } from "../test/socket";

describe("socket event handler", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const fixture = () => {
    const socket = new TestSocket();
    const eventEmitter = createNanoEvents<EventMap>();
    const reconnect = vi.fn();
    const onConnect = vi.fn();
    const handler = createSocketEventHandler({
      token: "TOKEN",
      socket,
      eventEmitter,
      reconnect,
      onConnect,
    });
    return { socket, eventEmitter, reconnect, onConnect, handler };
  };

  it("delivers messages and warns for malformed payloads", () => {
    const { socket, eventEmitter } = fixture();
    const listener = vi.fn();
    eventEmitter.on("user_update", listener);
    socket.onmessage?.(
      new MessageEvent("message", {
        data: '{"type":"user_update","value":{"account_active":false}}',
      }),
    );
    expect(listener).toHaveBeenCalledWith({ account_active: false });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    socket.onmessage?.(new MessageEvent("message", { data: "null" }));
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("resets heartbeat and reconnects once despite overlapping error/close callbacks", () => {
    const { socket, reconnect } = fixture();
    socket.open();
    const oldError = socket.onerror?.bind(socket);
    const oldClose = socket.onclose?.bind(socket);
    vi.advanceTimersByTime(11_000);
    socket.dispatchEvent(new Event("heartbeat"));
    vi.advanceTimersByTime(11_000);
    expect(reconnect).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1_000);
    oldError?.(Object.assign(new Event("error"), { code: "ECONNREFUSED" }));
    oldClose?.(new CloseEvent("close", { code: 1006 }));
    expect(socket.close).toHaveBeenCalledTimes(1);
    expect(reconnect).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not close an already closing socket at the heartbeat deadline", () => {
    const { socket, reconnect } = fixture();
    socket.open();
    socket.readyState = 2;
    vi.advanceTimersByTime(12_000);
    expect(socket.close).not.toHaveBeenCalled();
    expect(reconnect).toHaveBeenCalledTimes(1);
  });

  it("removes listeners and ignores captured callbacks after explicit close", () => {
    const { socket, handler, onConnect } = fixture();
    const open = socket.onopen?.bind(socket);
    const message = socket.onmessage?.bind(socket);
    handler.close();
    handler.close();
    open?.(new Event("open"));
    message?.(new MessageEvent("message", { data: "null" }));
    socket.dispatchEvent(new Event("heartbeat"));
    expect(onConnect).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    expect(socket.close).toHaveBeenCalledTimes(1);
  });
});
