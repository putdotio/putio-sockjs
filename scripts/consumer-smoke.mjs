import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const packageDir = process.cwd();
const nodeExecutable = process.execPath;
const npmCliPath = join(
  dirname(nodeExecutable),
  "..",
  "lib",
  "node_modules",
  "npm",
  "bin",
  "npm-cli.js",
);
const typescriptCliPath = join(packageDir, "node_modules", "typescript", "bin", "tsc");

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const runCommand = (command, args, cwd) => {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: process.env,
  });

  return {
    status: result.status ?? 1,
    stderr: result.stderr ?? "",
    stdout: result.stdout ?? "",
  };
};

const runNodeCommand = (args, cwd) => runCommand(nodeExecutable, args, cwd);

const runNpmCommand = (args, cwd) => runNodeCommand([npmCliPath, ...args], cwd);

const createPackedTarball = (cwd, destination) => {
  const packResult = runNpmCommand(["pack", "--pack-destination", destination], cwd);
  assert(packResult.status === 0, `npm pack failed: ${packResult.stderr || packResult.stdout}`);

  const tarball = readdirSync(destination).find((fileName) => fileName.endsWith(".tgz"));
  assert(tarball, "expected packed tarball");

  return join(destination, tarball);
};

const withTempDir = (prefix, run) => {
  const tempDir = mkdtempSync(join(tmpdir(), prefix));

  try {
    return run(tempDir);
  } finally {
    rmSync(tempDir, { force: true, recursive: true });
  }
};

const tests = [
  {
    name: "consumer tarball installs in a temp project",
    run: () =>
      withTempDir("putio-sockjs-consumer-install-", (tempDir) => {
        const tarball = createPackedTarball(packageDir, tempDir);

        writeFileSync(
          join(tempDir, "package.json"),
          JSON.stringify(
            {
              dependencies: {
                "@putdotio/socket-client": `file:${tarball}`,
              },
              name: "putio-sockjs-consumer-install",
              private: true,
              type: "module",
            },
            null,
            2,
          ),
        );

        const installResult = runNpmCommand(["install", "--ignore-scripts"], tempDir);
        assert(
          installResult.status === 0,
          `npm install failed: ${installResult.stderr || installResult.stdout}`,
        );
      }),
  },
  {
    name: "consumer types compile outside the workspace",
    run: () =>
      withTempDir("putio-sockjs-consumer-types-", (tempDir) => {
        const tarball = createPackedTarball(packageDir, tempDir);

        writeFileSync(
          join(tempDir, "package.json"),
          JSON.stringify(
            {
              dependencies: {
                "@putdotio/socket-client": `file:${tarball}`,
              },
              name: "putio-sockjs-consumer-types",
              private: true,
              type: "module",
            },
            null,
            2,
          ),
        );

        writeFileSync(
          join(tempDir, "tsconfig.json"),
          JSON.stringify(
            {
              compilerOptions: {
                module: "NodeNext",
                moduleResolution: "NodeNext",
                noEmit: true,
                // @putdotio/api-client ships declaration files that reference
                // untyped transitive modules; consumers need skipLibCheck.
                skipLibCheck: true,
                strict: true,
                target: "ES2022",
              },
              include: ["consumer.ts"],
            },
            null,
            2,
          ),
        );

        writeFileSync(
          join(tempDir, "consumer.ts"),
          [
            "import {",
            "  createPutioSocketClient,",
            "  DEFAULT_API_URL,",
            "  EVENT_TYPE,",
            "  type PutioSocketClient,",
            "  type PutioSocketClientConfig,",
            "  type SocketEvent,",
            "  type SocketEvents,",
            '} from "@putdotio/socket-client";',
            "",
            "const config: PutioSocketClientConfig = {",
            '  token: "consumer-smoke-token",',
            "  url: DEFAULT_API_URL,",
            "};",
            "",
            "const createClient: (config: PutioSocketClientConfig) => PutioSocketClient =",
            "  createPutioSocketClient;",
            "",
            'const customEvent: SocketEvents["Custom"] = {',
            "  type: EVENT_TYPE.CUSTOM,",
            '  value: { hello: "world" },',
            "};",
            "",
            "const event: SocketEvent = customEvent;",
            "",
            "void createClient;",
            "void config;",
            "void event;",
            "",
          ].join("\n"),
        );

        const installResult = runNpmCommand(["install", "--ignore-scripts"], tempDir);
        assert(
          installResult.status === 0,
          `npm install failed: ${installResult.stderr || installResult.stdout}`,
        );

        const typecheckResult = runNodeCommand(
          [typescriptCliPath, "--project", "tsconfig.json"],
          tempDir,
        );
        assert(
          typecheckResult.status === 0,
          `consumer typecheck failed: ${typecheckResult.stderr || typecheckResult.stdout}`,
        );
      }),
  },
  {
    name: "consumer runtime import works from the installed package",
    run: () =>
      withTempDir("putio-sockjs-consumer-runtime-", (tempDir) => {
        const tarball = createPackedTarball(packageDir, tempDir);

        writeFileSync(
          join(tempDir, "package.json"),
          JSON.stringify(
            {
              dependencies: {
                "@putdotio/socket-client": `file:${tarball}`,
              },
              name: "putio-sockjs-consumer-runtime",
              private: true,
              type: "module",
            },
            null,
            2,
          ),
        );

        writeFileSync(
          join(tempDir, "runtime.mjs"),
          [
            'import { createPutioSocketClient, EVENT_TYPE } from "@putdotio/socket-client";',
            "",
            'if (typeof createPutioSocketClient !== "function") {',
            '  throw new Error("createPutioSocketClient export is not callable");',
            "}",
            "",
            'if (EVENT_TYPE.TRANSFER_UPDATE !== "transfer_update") {',
            '  throw new Error("EVENT_TYPE export is missing expected event names");',
            "}",
            "",
            "console.log(JSON.stringify({ ok: true }));",
            "",
          ].join("\n"),
        );

        const installResult = runNpmCommand(["install", "--ignore-scripts"], tempDir);
        assert(
          installResult.status === 0,
          `npm install failed: ${installResult.stderr || installResult.stdout}`,
        );

        const runtimeResult = runNodeCommand(["runtime.mjs"], tempDir);
        assert(
          runtimeResult.status === 0,
          `consumer runtime failed: ${runtimeResult.stderr || runtimeResult.stdout}`,
        );
      }),
  },
  {
    name: "consumer cannot import internal package paths",
    run: () =>
      withTempDir("putio-sockjs-consumer-exports-", (tempDir) => {
        const tarball = createPackedTarball(packageDir, tempDir);

        writeFileSync(
          join(tempDir, "package.json"),
          JSON.stringify(
            {
              dependencies: {
                "@putdotio/socket-client": `file:${tarball}`,
              },
              name: "putio-sockjs-consumer-exports",
              private: true,
              type: "module",
            },
            null,
            2,
          ),
        );

        writeFileSync(
          join(tempDir, "runtime.mjs"),
          [
            "let importError;",
            "",
            "try {",
            '  await import("@putdotio/socket-client/src/client");',
            "} catch (error) {",
            "  importError = error;",
            "}",
            "",
            "if (!importError) {",
            '  throw new Error("internal path import unexpectedly succeeded");',
            "}",
            "",
            "const message = String(importError.code || importError.message || importError);",
            "",
            'if (!message.includes("ERR_PACKAGE_PATH_NOT_EXPORTED") && !message.includes("not exported")) {',
            "  throw new Error(`unexpected internal path error: ${message}`);",
            "}",
            "",
            "console.log(JSON.stringify({ ok: true }));",
            "",
          ].join("\n"),
        );

        const installResult = runNpmCommand(["install", "--ignore-scripts"], tempDir);
        assert(
          installResult.status === 0,
          `npm install failed: ${installResult.stderr || installResult.stdout}`,
        );

        const runtimeResult = runNodeCommand(["runtime.mjs"], tempDir);
        assert(
          runtimeResult.status === 0,
          `consumer export boundary check failed: ${runtimeResult.stderr || runtimeResult.stdout}`,
        );
      }),
  },
];

for (const test of tests) {
  try {
    test.run();
    console.log(`[pass] ${test.name}`);
  } catch (error) {
    console.error(`[fail] ${test.name}`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
