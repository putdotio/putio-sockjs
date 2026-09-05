import { vi } from "vite-plus/test";

export class TestSocket extends EventTarget implements WebSocket {
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;
  binaryType: BinaryType = "blob";
  bufferedAmount = 0;
  extensions = "";
  protocol = "";
  readyState: WebSocket["readyState"] = 0;
  url = "https://socket.invalid";
  onopen: WebSocket["onopen"] = null;
  onclose: WebSocket["onclose"] = null;
  onerror: WebSocket["onerror"] = null;
  onmessage: WebSocket["onmessage"] = null;
  send = vi.fn();
  close = vi.fn(() => this.end(1000));
  open() {
    this.readyState = 1;
    this.onopen?.(new Event("open"));
  }
  end(code: number) {
    this.readyState = 3;
    this.onclose?.(new CloseEvent("close", { code }));
  }
  refuse() {
    this.onerror?.(Object.assign(new Event("error"), { code: "ECONNREFUSED" }));
  }
}
