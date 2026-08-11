const ALWAYS_PASS_TEST_SECRET = "1x0000000000000000000000000000000AA";

type TurnstileResult = {
  success?: boolean;
  hostname?: string;
  "error-codes"?: string[];
};

export async function verifyTurnstile(token: string, ip: string) {
  if (process.env.NODE_ENV !== "production" && process.env.DISABLE_PUBLISH_PROTECTION === "true") return true;
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !token) return false;
  if (process.env.NODE_ENV === "production" && secret === ALWAYS_PASS_TEST_SECRET) return false;
  const form = new FormData();
  form.set("secret", secret);
  form.set("response", token);
  form.set("remoteip", ip);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
    const result = (await response.json()) as TurnstileResult;
    if (result.success !== true) {
      console.warn("[turnstile] verification failed", {
        errorCodes: result["error-codes"] ?? [],
        hostname: result.hostname ?? null,
        tokenPresent: token.length > 0,
      });
    }
    return result.success === true;
  } catch (error) {
    console.warn("[turnstile] verification request failed", { message: error instanceof Error ? error.message : "unknown error" });
    return false;
  }
}
