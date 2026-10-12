import { describe, it, expect, vi, beforeEach } from "vitest";
import * as vscode from "vscode";
import { registerCommandWithTelemetry } from "@src/utils/registerCommands";

vi.mock("vscode", () => ({
  commands: { registerCommand: vi.fn() },
  window: { showErrorMessage: vi.fn() },
}));

describe("registerCommandWithTelemetry arguments", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([undefined, { fsPath: "/workspace/infra/site.yml" }])(
    "forwards the supplied CodeLens/menu resource (%s)",
    async (argument) => {
      const action = vi.fn().mockResolvedValue(undefined);
      const telemetry = {
        sendCommandSucceededTelemetry: vi.fn(),
        sendCommandFailedTelemetry: vi.fn(),
      };
      await registerCommandWithTelemetry(
        { subscriptions: [] } as never,
        telemetry as never,
        "run",
        action,
      );
      const callback = vi.mocked(vscode.commands.registerCommand).mock
        .calls[0][1];
      await callback(argument);
      expect(action).toHaveBeenCalledWith(argument);
      expect(telemetry.sendCommandSucceededTelemetry).toHaveBeenCalledWith(
        "run",
      );
    },
  );

  it("still handles failures and skipSuccess", async () => {
    const telemetry = {
      sendCommandSucceededTelemetry: vi.fn(),
      sendCommandFailedTelemetry: vi.fn(),
    };
    await registerCommandWithTelemetry(
      { subscriptions: [] } as never,
      telemetry as never,
      "run",
      vi.fn().mockRejectedValue(new Error("failed")),
      true,
    );
    await vi.mocked(vscode.commands.registerCommand).mock.calls[0][1]();
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith("failed");
    expect(telemetry.sendCommandFailedTelemetry).toHaveBeenCalledWith(
      "run",
      "failed",
    );
    expect(telemetry.sendCommandSucceededTelemetry).not.toHaveBeenCalled();
  });
});
