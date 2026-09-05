import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { build } from "vite";

const workspace = mkdtempSync(join(tmpdir(), "putio-socket-browser-"));
let browser;
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
try {
  execFileSync("npm", ["pack", "--pack-destination", workspace], { stdio: "inherit" });
  const tarball = readdirSync(workspace).find((file) => file.endsWith(".tgz"));
  assert(tarball, "Missing packed socket client");
  writeFileSync(
    join(workspace, "package.json"),
    JSON.stringify({
      private: true,
      type: "module",
      dependencies: { "@putdotio/socket-client": `file:${join(workspace, tarball)}` },
    }),
  );
  execFileSync("npm", ["install", "--ignore-scripts", "--no-audit", "--fund=false"], {
    cwd: workspace,
    stdio: "inherit",
  });
  writeFileSync(
    join(workspace, "fixture.js"),
    'import { createPutioSocketClient } from "@putdotio/socket-client"; globalThis.createClient = createPutioSocketClient;',
  );
  await build({
    configFile: false,
    define: { global: "globalThis", "process.env.NODE_ENV": JSON.stringify("production") },
    root: workspace,
    build: {
      lib: {
        entry: join(workspace, "fixture.js"),
        name: "SocketFixture",
        formats: ["iife"],
        fileName: () => "fixture.js",
      },
    },
  });
  const bundle = readFileSync(join(workspace, "dist/fixture.js"), "utf8");
  browser = await chromium.launch();

  for (const mode of ["explicit", "terminal", "backoff", "cancel-delay", "reconnect-success"]) {
    const page = await browser.newPage();
    const sockets = [];
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error));
    let nextSocket;
    await page.clock.install();
    await page.route("https://socket.invalid/**", (route) =>
      route.fulfill({
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify({
          websocket: true,
          origins: ["*:*"],
          cookie_needed: false,
          entropy: 1,
        }),
      }),
    );
    await page.routeWebSocket("**/websocket", (socket) => {
      sockets.push(socket);
      nextSocket?.(socket);
      nextSocket = undefined;
    });
    const waitSocket = (count) => {
      if (sockets.length >= count) return Promise.resolve(sockets[count - 1]);
      return new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error(`Missing socket ${count} in ${mode}`)),
          10_000,
        );
        nextSocket = (socket) => {
          clearTimeout(timer);
          resolve(socket);
        };
      });
    };
    const closeSocket = async (socket, code) => {
      await page.evaluate(() => {
        window.disconnected = new Promise((resolve) => window.client.on("disconnect", resolve));
      });
      socket.send(`c[${code},"fixture close"]`);
      await page.evaluate(() => window.disconnected);
    };
    try {
      await page.goto("https://socket.invalid/");
      await page.addScriptTag({ content: bundle });
      await page.evaluate(() => {
        window.events = [];
        window.client = window.createClient({
          token: "fixture-token",
          url: "https://socket.invalid/socket",
        });
        for (const name of ["connect", "reconnect", "disconnect", "error"])
          window.client.on(name, () => window.events.push(name));
      });
      await page.clock.runFor(1);
      const initial = await waitSocket(1);
      const authenticated = new Promise((resolve) => initial.onMessage(resolve));
      initial.send("o");
      assert(
        (await authenticated) === '["fixture-token"]',
        "SockJS authentication payload changed",
      );
      if (mode === "explicit") await page.evaluate(() => window.client.close());
      else if (mode === "terminal") await closeSocket(initial, 4001);
      else {
        await closeSocket(initial, 1006);
        await page.clock.runFor(0);
        await waitSocket(2);
        if (mode === "cancel-delay") {
          await closeSocket(sockets[1], 1006);
          await page.evaluate(() => window.client.close());
        } else if (mode === "reconnect-success") {
          const authenticatedAgain = new Promise((resolve) => sockets[1].onMessage(resolve));
          sockets[1].send("o");
          assert(
            (await authenticatedAgain) === '["fixture-token"]',
            "Reconnect authentication changed",
          );
          const events = await page.evaluate(() => window.events);
          assert(
            JSON.stringify(events) ===
              JSON.stringify(["connect", "disconnect", "connect", "reconnect"]),
            "Reconnect event order changed",
          );
          await page.evaluate(() => window.client.close());
        } else {
          for (let attempt = 1; attempt < 10; attempt++) {
            await closeSocket(sockets[attempt], 1006);
            const delay = 100 * 2 ** (attempt - 1);
            await page.clock.runFor(delay - 1);
            assert(sockets.length === attempt + 1, "Reconnect ran before backoff deadline");
            await page.clock.runFor(1);
            await waitSocket(attempt + 2);
          }
          await closeSocket(sockets[10], 1006);
        }
      }
      await page.clock.runFor(120_000);
      const expected =
        mode === "backoff" ? 11 : ["cancel-delay", "reconnect-success"].includes(mode) ? 2 : 1;
      assert(sockets.length === expected, `Unexpected socket count in ${mode}: ${sockets.length}`);
      assert(pageErrors.length === 0, `Browser errors: ${pageErrors.join("; ")}`);
      console.log(`[pass] installed browser lifecycle: ${mode}`);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser?.close();
  rmSync(workspace, { recursive: true, force: true });
}
