import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import type { Emitter } from "nanoevents";
import { createClientFactoryWithDependencies, type PutioSocketClient } from "./client";
import type { EventMap, SocketEvents } from "./types";

vi.useFakeTimers();

const doMagic = async () => {
  await vi.runAllTimersAsync();
};

describe("PutioSocketClient with mocked dependencies", () => {
  let client: PutioSocketClient;
  const mockConfig = { url: "test.io", token: "TOKEN" };
  const mockedEmitter = {
    emit: vi.fn(),
    on: vi.fn(() => () => {}),
  } as unknown as Emitter<EventMap>;
  const mockedWebSocket = {
    addEventListener: vi.fn(),
    close: vi.fn(),
    send: vi.fn(),
  } as unknown as WebSocket;
  const createMockedEmitter = vi.fn(() => mockedEmitter);
  const createMockedWebSocket = vi.fn((_: string) => mockedWebSocket);
  const createClient = createClientFactoryWithDependencies(
    createMockedEmitter,
    createMockedWebSocket,
  );

  describe("commands", () => {
    beforeEach(() => {
      client = createClient(mockConfig);
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it("handles send command", () => {
      const message: SocketEvents["Custom"] = {
        type: "custom",
        value: { foo: "bar" },
      };

      client.send(message);
      expect(mockedWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it("handles close command", () => {
      client.close();
      expect(mockedWebSocket.close).toHaveBeenCalled();

      const event = new CloseEvent("close");
      if (mockedWebSocket.onclose) {
        mockedWebSocket.onclose(event);
      }
      expect(mockedEmitter.emit).toHaveBeenCalledWith("disconnect", event);
    });
  });

  describe("reconnect flow", () => {
    beforeEach(() => {
      client = createClient(mockConfig);
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it("tries to reconnect after close and error: connection refused events", async () => {
      expect(createMockedWebSocket).toHaveBeenCalledTimes(1);

      if (mockedWebSocket.onopen) {
        mockedWebSocket.onopen(new Event("Connected"));
      }
      expect(mockedEmitter.emit).toHaveBeenCalledWith("connect");

      if (mockedWebSocket.onclose) {
        mockedWebSocket.onclose({ code: 1001 } as CloseEvent);
      }
      await doMagic();
      expect(createMockedWebSocket).toHaveBeenCalledTimes(2);

      if (mockedWebSocket.onerror) {
        mockedWebSocket.onerror({ code: "ECONNREFUSED" } as Event);
      }
      await doMagic();
      expect(createMockedWebSocket).toHaveBeenCalledTimes(3);

      if (mockedWebSocket.onclose) {
        mockedWebSocket.onclose({ code: 1005 } as CloseEvent);
      }
      await doMagic();
      expect(createMockedWebSocket).toHaveBeenCalledTimes(4);

      if (mockedWebSocket.onopen) {
        mockedWebSocket.onopen(new Event("Reconnected"));
      }
      expect(mockedEmitter.emit).toHaveBeenCalledWith("connect");
      expect(mockedEmitter.emit).toHaveBeenCalledWith("reconnect");
      expect(createMockedWebSocket).toHaveBeenCalledTimes(4);
    });
  });
});
