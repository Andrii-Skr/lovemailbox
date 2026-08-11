const ALWAYS_PASS_TEST_SECRET = "1x0000000000000000000000000000000AA";

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
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}
