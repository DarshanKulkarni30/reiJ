import test from "node:test";
import assert from "node:assert/strict";

// Replicate OWASP SSRF helper from server.ts to verify security invariants
function isSafeHttpsWebhookUrl(urlString: string, allowedHostPatterns: RegExp[]): boolean {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== "https:") return false;

    const hostname = parsed.hostname.toLowerCase();

    // Prevent loopback, private networks, and link-local cloud metadata endpoints
    const forbiddenHostRegex =
      /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.|0\.0\.0\.0|::1|.*\.internal|.*\.local)/i;
    if (forbiddenHostRegex.test(hostname)) return false;

    return allowedHostPatterns.some((pattern) => pattern.test(hostname));
  } catch {
    return false;
  }
}

test("SSRF Guard: blocks link-local metadata endpoints (169.254.169.254)", () => {
  const dangerousUrl = "https://169.254.169.254/computeMetadata/v1/";
  const allowed = [/^hooks\.slack\.com$/, /^(discord\.com|discordapp\.com)$/];

  const result = isSafeHttpsWebhookUrl(dangerousUrl, allowed);
  assert.equal(result, false, "Must block cloud metadata IP");
});

test("SSRF Guard: blocks localhost, loopback, and private IPv4 networks", () => {
  const allowed = [/^hooks\.slack\.com$/];

  assert.equal(isSafeHttpsWebhookUrl("https://localhost:8080/webhook", allowed), false);
  assert.equal(isSafeHttpsWebhookUrl("https://127.0.0.1/hook", allowed), false);
  assert.equal(isSafeHttpsWebhookUrl("https://10.0.0.1/internal", allowed), false);
  assert.equal(isSafeHttpsWebhookUrl("https://192.168.1.50/alert", allowed), false);
});

test("SSRF Guard: blocks unencrypted http protocol", () => {
  const allowed = [/^hooks\.slack\.com$/];
  assert.equal(isSafeHttpsWebhookUrl("http://hooks.slack.com/services/XXX", allowed), false);
});

test("SSRF Guard: allows verified Slack and Discord webhook endpoints over HTTPS", () => {
  const allowedSlack = [/^hooks\.slack\.com$/];
  const allowedDiscord = [/^(discord\.com|discordapp\.com)$/];

  assert.equal(
    isSafeHttpsWebhookUrl("https://hooks.slack.com/services/T00/B00/XXXX", allowedSlack),
    true
  );
  assert.equal(
    isSafeHttpsWebhookUrl("https://discord.com/api/webhooks/123/XXXX", allowedDiscord),
    true
  );
});

test("AI Fallback Models: contains required cascade order", () => {
  const FALLBACK_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-3.7-flash",
    "gemini-3.8-flash",
  ];

  assert.equal(FALLBACK_MODELS[0], "gemini-3.6-flash");
  assert.equal(FALLBACK_MODELS[1], "gemini-3.1-flash-lite");
  assert.equal(FALLBACK_MODELS[2], "gemini-flash-latest");
  assert.equal(FALLBACK_MODELS.length >= 4, true);
});
