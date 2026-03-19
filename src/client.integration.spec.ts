import { describe, it } from "vite-plus/test";
import { createPutioSocketClient } from "./client";

describe("PutioSocketClient", () => {
  it.runIf(process.env.PUTIO_SOCKJS_INTEGRATION === "1")("connects without exploding", (done) => {
    const client = createPutioSocketClient({ token: "TOKEN" });

    client.on("connect", () => {
      client.close();
      done();
    });
  });
});
