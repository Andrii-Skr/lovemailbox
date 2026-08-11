import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/projects/route";

describe("POST /api/projects", () => {
  it("rejects a null JSON payload without throwing", async () => {
    const request = new NextRequest("http://localhost/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "null",
    });

    const response = await POST(request);
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ message: "Validation failed" });
  });
});
