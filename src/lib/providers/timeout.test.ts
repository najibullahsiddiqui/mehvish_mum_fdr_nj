import { describe, expect, it } from "vitest";
import { ProviderTimeoutError } from "@/lib/providers/errors";
import { withTimeout } from "@/lib/providers/timeout";

describe("withTimeout", () => {
  it("resolves before the timeout", async () => {
    await expect(withTimeout(async () => "ok", 50)).resolves.toBe("ok");
  });

  it("fails cleanly when the task ignores abort", async () => {
    await expect(
      withTimeout(
        () =>
          new Promise<string>((resolve) => {
            setTimeout(() => resolve("late"), 50);
          }),
        5,
        "slow mock",
      ),
    ).rejects.toThrow(ProviderTimeoutError);
  });
});
