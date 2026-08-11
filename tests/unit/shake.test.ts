import { describe, expect, it, vi } from "vitest";
import { createShakeProcessor } from "@/hooks/use-shake-detection";

function motion(x: number, y = 0, z = 0) {
  return { acceleration: { x, y, z }, accelerationIncludingGravity: null } as Pick<DeviceMotionEvent, "acceleration" | "accelerationIncludingGravity">;
}

describe("shake processor", () => {
  it("ignores normal movement and triggers after two peaks", () => {
    const onShake = vi.fn();
    const process = createShakeProcessor({ onShake });
    process(motion(3), 1000);
    process(motion(20), 1100);
    process(motion(-21), 1250);
    expect(onShake).toHaveBeenCalledTimes(1);
  });

  it("applies cooldown to prevent a double letter", () => {
    const onShake = vi.fn();
    const process = createShakeProcessor({ onShake, cooldownMs: 1700 });
    process(motion(20), 1000);
    process(motion(-21), 1100);
    process(motion(22), 1300);
    process(motion(-22), 1400);
    expect(onShake).toHaveBeenCalledTimes(1);
  });
});
