import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { createNanoEvents } from "nanoevents";
import { createClientFactoryWithDependencies } from "./client";
import type { EventMap } from "./types";
import { TestSocket } from "../test/socket";

const fixture = () => {
  const sockets: Array<TestSocket> = [];
  const createdAt: Array<number> = [];
  const emitter = createNanoEvents<EventMap>();
  const client = createClientFactoryWithDependencies(
    () => emitter,
    () => {
      const socket = new TestSocket();
      sockets.push(socket);
      createdAt.push(Date.now());
      return socket;
    },
  )({ token: "fixture-token" });
  const latest = () => {
    const socket = sockets.at(-1);
    if (!socket) throw new Error("Missing socket");
    return socket;
  };
  return { client, sockets, latest, createdAt };
};

describe("socket lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("sends payloads and preserves connect/disconnect events", () => {
    const { client, latest } = fixture();
    const connect = vi.fn();
    const disconnect = vi.fn();
    const unsubscribe = client.on("connect", connect);
    client.on("disconnect", disconnect);
    latest().open();
    expect(connect).toHaveBeenCalledTimes(1);
    expect(latest().send).toHaveBeenCalledWith("fixture-token");
    client.send({ type: "custom", value: { test: true } });
    expect(latest().send).toHaveBeenCalledWith('{"type":"custom","value":{"test":true}}');
    unsubscribe();
    client.close();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it.each(["explicit", 1000, 1011, 4001] as const)(
    "stops heartbeat after %s closure",
    async (kind) => {
      const { client, latest, sockets } = fixture();
      latest().open();
      if (kind === "explicit") {
        client.close();
        client.close();
      } else latest().end(kind);
      expect(vi.getTimerCount()).toBe(0);
      await vi.advanceTimersByTimeAsync(120_000);
      expect(sockets).toHaveLength(1);
    },
  );

  it("bounds failed handshakes and doubles the delay within one reconnect sequence", async () => {
    const { latest, sockets, createdAt } = fixture();
    latest().end(1006);
    await vi.advanceTimersByTimeAsync(0);
    expect(sockets).toHaveLength(2);
    for (let attempt = 1; attempt < 10; attempt++) {
      latest().refuse();
      const delay = 100 * 2 ** (attempt - 1);
      await vi.advanceTimersByTimeAsync(delay - 1);
      expect(sockets).toHaveLength(attempt + 1);
      await vi.advanceTimersByTimeAsync(1);
      expect(sockets).toHaveLength(attempt + 2);
    }
    latest().end(1006);
    await vi.advanceTimersByTimeAsync(120_000);
    expect(sockets).toHaveLength(11);
    expect(createdAt).toEqual([0, 0, 100, 300, 700, 1500, 3100, 6300, 12700, 25500, 51100]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("bounds synchronous socket construction failures without unhandled rejections", async () => {
    const socket = new TestSocket();
    const emitter = createNanoEvents<EventMap>();
    const createSocket = vi.fn(() => {
      if (createSocket.mock.calls.length > 1) throw new Error("Connection setup failed");
      return socket;
    });
    const client = createClientFactoryWithDependencies(
      () => emitter,
      createSocket,
    )({ token: "fixture-token" });
    const error = vi.fn();
    client.on("error", error);
    socket.end(1006);
    await vi.advanceTimersByTimeAsync(120_000);
    expect(createSocket).toHaveBeenCalledTimes(11);
    expect(error).toHaveBeenCalledTimes(10);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("cancels a queued retry and ignores callbacks retained from old sockets", async () => {
    const { client, latest, sockets } = fixture();
    const old = latest();
    const lateOpen = old.onopen?.bind(old);
    const lateClose = old.onclose?.bind(old);
    old.end(1006);
    await vi.advanceTimersByTimeAsync(0);
    latest().end(1006);
    client.close();
    lateOpen?.(new Event("open"));
    lateClose?.(new CloseEvent("close", { code: 1006 }));
    old.dispatchEvent(new Event("heartbeat"));
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(120_000);
    expect(sockets).toHaveLength(2);
    expect(old.send).not.toHaveBeenCalled();
  });

  it.each(["explicit", 4001] as const)("stops a connecting retry on %s closure", async (kind) => {
    const { client, latest, sockets } = fixture();
    latest().end(1006);
    await vi.advanceTimersByTimeAsync(0);
    if (kind === "explicit") client.close();
    else latest().end(kind);
    await vi.advanceTimersByTimeAsync(120_000);
    expect(sockets).toHaveLength(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps old socket callbacks inert after a replacement opens", async () => {
    const { client, latest, sockets } = fixture();
    const old = latest();
    const staleError = old.onerror?.bind(old);
    const staleOpen = old.onopen?.bind(old);
    old.end(1006);
    await vi.advanceTimersByTimeAsync(0);
    latest().open();
    staleError?.(Object.assign(new Event("error"), { code: "ECONNREFUSED" }));
    staleOpen?.(new Event("open"));
    await vi.advanceTimersByTimeAsync(0);
    expect(sockets).toHaveLength(2);
    expect(old.send).not.toHaveBeenCalled();
    client.close();
  });

  it("resets retry state on open and emits connect before reconnect", async () => {
    const { client, latest, sockets } = fixture();
    const events: Array<string> = [];
    client.on("connect", () => events.push("connect"));
    client.on("reconnect", () => events.push("reconnect"));
    latest().end(1006);
    await vi.advanceTimersByTimeAsync(0);
    latest().open();
    expect(events).toEqual(["connect", "reconnect"]);
    latest().end(1006);
    await vi.advanceTimersByTimeAsync(0);
    expect(sockets).toHaveLength(3);
    client.close();
  });

  it("allows a connect subscriber to close without emitting reconnect or restarting", async () => {
    const { client, latest, sockets } = fixture();
    client.on("connect", () => client.close());
    const reconnect = vi.fn();
    client.on("reconnect", reconnect);
    latest().end(1006);
    await vi.advanceTimersByTimeAsync(0);
    latest().open();
    await vi.advanceTimersByTimeAsync(120_000);
    expect(reconnect).not.toHaveBeenCalled();
    expect(sockets).toHaveLength(2);
  });
});
