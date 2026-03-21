import { describe, it, expect } from "vitest";
import { exec } from "../src/exec.js";

describe("exec", () => {
  it("resolves when the command succeeds", async () => {
    await expect(exec("true")).resolves.toBeUndefined();
  });

  it("rejects when the command exits with non-zero code", async () => {
    await expect(exec("false")).rejects.toThrow("Command exited with code 1");
  });

  it("rejects for an unknown command", async () => {
    await expect(exec("this-command-does-not-exist-xyz")).rejects.toThrow();
  });

  it("runs a real shell command and exits cleanly", async () => {
    await expect(exec("echo hello > /dev/null")).resolves.toBeUndefined();
  });

  it("supports shell features like pipes", async () => {
    await expect(exec("echo hello | cat > /dev/null")).resolves.toBeUndefined();
  });

  it("rejects when exit code is non-zero mid-pipeline with pipefail", async () => {
    await expect(exec('bash -o pipefail -c "false | cat"')).rejects.toThrow();
  });
});
