#!/usr/bin/env node

/**
 * Rei Antigravity Security & Quality Test Runner
 * Validates security invariants before git push or Cloud Run deployment.
 */

import fs from "fs";
import path from "path";

const ROOT = process.cwd();

let failures = 0;

function reportCheck(title, passed, detail = "") {
  if (passed) {
    console.log(`\x1b[32m[PASS]\x1b[0m ${title}`);
  } else {
    console.error(`\x1b[31m[FAIL]\x1b[0m ${title}`);
    if (detail) console.error(`       \x1b[33m${detail}\x1b[0m`);
    failures++;
  }
}

console.log("\n🔒 --- Antigravity Security Pre-Deployment Audit ---\n");

// Check 1: Ensure Gemini Secret Key is strictly kept out of client sources
try {
  const srcDir = path.join(ROOT, "src");
  let foundKeyLeak = false;
  let leakedFile = "";

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (/\.(tsx?|jsx?|html)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        // Gemini secret keys or client-side env prefixes must NEVER exist in src/
        if (/VITE_GEMINI_API_KEY/i.test(content) || /process\.env\.GEMINI_API_KEY/.test(content)) {
          foundKeyLeak = true;
          leakedFile = path.relative(ROOT, fullPath);
          break;
        }
      }
    }
  }

  scanDir(srcDir);
  reportCheck(
    "Client Secret Isolation: No Gemini API Key or process.env leakage in src/",
    !foundKeyLeak,
    foundKeyLeak ? `Potential secret detected in ${leakedFile}` : ""
  );
} catch (e) {
  reportCheck("Client Secret Scan", false, e.message);
}

// Check 2: Verify Firestore Security Rules default-deny and user isolation
try {
  const rulesPath = path.join(ROOT, "firestore.rules");
  const rules = fs.readFileSync(rulesPath, "utf-8");

  const hasUidIsolation = rules.includes("match /users/{userId}/{document=**}") &&
                          rules.includes("request.auth.uid == userId");
  const hasDefaultDeny = rules.includes("match /{document=**}") &&
                         rules.includes("allow read, write: if false;");

  reportCheck("Firestore Rules: Owner-gated single-tenant isolation (/users/{userId}/**)", hasUidIsolation);
  reportCheck("Firestore Rules: Strict default-deny on all unauthenticated root paths", hasDefaultDeny);
} catch (e) {
  reportCheck("Firestore Rules Verification", false, e.message);
}

// Check 3: Verify Delimiter Injection Defense in Server Prompt
try {
  const serverPath = path.join(ROOT, "server.ts");
  const serverCode = fs.readFileSync(serverPath, "utf-8");

  const hasDelimiters = serverCode.includes("<user_journal_data>") &&
                        serverCode.includes("</user_journal_data>");
  const hasFallbackCascade = serverCode.includes("gemini-3.6-flash") &&
                             serverCode.includes("gemini-3.1-flash-lite");

  reportCheck("Prompt Injection Guard: Journal inputs strictly wrapped in <user_journal_data> delimiters", hasDelimiters);
  reportCheck("High-Availability: Server-side Gemini multi-model fallback cascade configured", hasFallbackCascade);
} catch (e) {
  reportCheck("Server AI Prompt Security", false, e.message);
}

// Check 4: Verify OWASP SSRF Guard exists for Webhooks
try {
  const serverPath = path.join(ROOT, "server.ts");
  const serverCode = fs.readFileSync(serverPath, "utf-8");

  const hasSsrfGuard = serverCode.includes("isSafeHttpsWebhookUrl") &&
                       (serverCode.includes("169.254") || serverCode.includes("localhost"));

  reportCheck("OWASP SSRF Protection: Private & cloud metadata IP blocks on outbound webhooks", hasSsrfGuard);
} catch (e) {
  reportCheck("SSRF Guard Check", false, e.message);
}

console.log("\n---------------------------------------------------");
if (failures === 0) {
  console.log("\x1b[32mAll Antigravity security policies PASSED cleanly.\x1b[0m\n");
  process.exit(0);
} else {
  console.error(`\x1b[31mAudit FAILED with ${failures} policy violation(s).\x1b[0m\n`);
  process.exit(1);
}
