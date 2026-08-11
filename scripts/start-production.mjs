import { spawn } from "node:child_process";

const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";
const TURNSTILE_TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";

function productionEnvironmentErrors(environment = process.env) {
  const required = [
    "DATABASE_URL",
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    "TURNSTILE_SECRET_KEY",
    "IP_HASH_SECRET",
  ];
  const errors = required.filter((name) => !environment[name]).map((name) => `${name} is required`);

  if (environment.DATABASE_URL?.includes(":change-me@")) errors.push("DATABASE_URL uses the example password");
  if (environment.NEXT_PUBLIC_TURNSTILE_SITE_KEY === TURNSTILE_TEST_SITE_KEY) errors.push("NEXT_PUBLIC_TURNSTILE_SITE_KEY uses Cloudflare's test key");
  if (environment.TURNSTILE_SECRET_KEY === TURNSTILE_TEST_SECRET_KEY) errors.push("TURNSTILE_SECRET_KEY uses Cloudflare's test key");
  if (environment.IP_HASH_SECRET === "replace-with-at-least-32-random-characters" || (environment.IP_HASH_SECRET?.length ?? 0) < 32) {
    errors.push("IP_HASH_SECRET must be a non-placeholder value of at least 32 characters");
  }
  try {
    if (new URL(environment.NEXT_PUBLIC_SITE_URL).protocol !== "https:") errors.push("NEXT_PUBLIC_SITE_URL must use HTTPS");
  } catch {
    errors.push("NEXT_PUBLIC_SITE_URL must be a valid absolute URL");
  }
  return errors;
}

const errors = productionEnvironmentErrors();
if (errors.length > 0) {
  console.error(`[startup] insecure production configuration:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

const server = spawn(process.execPath, ["server.js"], { env: process.env, stdio: "inherit" });
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.kill(signal));
}
server.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
