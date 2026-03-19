import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import type { Emitter } from "nanoevents";
import createSocketEventHandler from "./socketEventHandler";
import type { EventMap } from "./types";

describe("SocketEventHandler", () => {
  let webSocketEventMap: Record<string, EventListener> = {};
  const mockToken = "TOKEN";
  const mockedWebSocket = {
    addEventListener: vi.fn(),
    close: vi.fn(),
    readyState: 1,
    send: vi.fn(),
  } as unknown as WebSocket;
  const mockedEmitter = {
    emit: vi.fn(),
    on: vi.fn(() => () => {}),
  } as unknown as Emitter<EventMap>;
  const mockedReconnect = vi.fn();
  const mockedOnConnect = vi.fn();

  beforeAll(() => {
    vi.useFakeTimers();
  });

  beforeEach(() => {
    webSocketEventMap = {};

    mockedWebSocket.addEventListener = vi.fn((event, callback) => {
      webSocketEventMap[event] = callback;
    }) as unknown as WebSocket["addEventListener"];

    createSocketEventHandler({
      token: mockToken,
      socket: mockedWebSocket,
      eventEmitter: mockedEmitter,
      reconnect: mockedReconnect,
      onConnect: mockedOnConnect,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("handles connect event", () => {
    if (mockedWebSocket.onopen) {
      mockedWebSocket.onopen(new Event("open"));
    }
    expect(mockedEmitter.emit).toHaveBeenCalledWith("connect");
    expect(mockedWebSocket.send).toHaveBeenCalledWith(mockToken);
  });

  describe("message event", () => {
    it("with valid payload", () => {
      const event = new MessageEvent("user_update", {
        data: JSON.stringify({
          type: "user_update",
          value: { account_active: false },
        }),
      });

      if (mockedWebSocket.onmessage) {
        mockedWebSocket.onmessage(event);
      }

      expect(mockedEmitter.emit).toHaveBeenCalledWith("user_update", {
        account_active: false,
      });
    });

    it("with invalid payload", () => {
      vi.spyOn(console, "warn").mockImplementation(() => undefined);

      const event = new MessageEvent("invalid_event", {
        data: JSON.stringify(null),
      });

      if (mockedWebSocket.onmessage) {
        mockedWebSocket.onmessage(event);
      }
      expect(mockedEmitter.emit).not.toHaveBeenCalled();
    });
  });

  it("handles error event", () => {
    if (mockedWebSocket.onerror) {
      mockedWebSocket.onerror(new Event("error"));
    }
    expect(mockedEmitter.emit).toHaveBeenCalledWith("error");
  });

  describe("heartbeat -> close + reconnect flow", () => {
    beforeEach(() => {
      if (mockedWebSocket.onopen) {
        mockedWebSocket.onopen(new Event("open"));
      }
    });

    it("assumes connection is problematic based on heartbeat event", () => {
      vi.advanceTimersByTime(12_000);
      expect(mockedWebSocket.close).toHaveBeenCalled();
      expect(mockedReconnect).toHaveBeenCalled();
    });

    it("does not try to close websocket connection if it is already closing", () => {
      (mockedWebSocket as { readyState: number }).readyState = 2;
      vi.advanceTimersByTime(12_000);
      expect(mockedWebSocket.close).not.toHaveBeenCalled();
      expect(mockedReconnect).toHaveBeenCalled();
    });
  });
});
