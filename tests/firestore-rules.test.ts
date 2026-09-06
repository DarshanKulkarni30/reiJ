import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Firestore Rules: contains strict owner isolation and global deny", () => {
  const rulesPath = path.join(process.cwd(), "firestore.rules");
  const rules = fs.readFileSync(rulesPath, "utf-8");

  assert.match(rules, /rules_version\s*=\s*'2';/);
  assert.match(rules, /match\s+\/users\/\{userId\}\/\{document=\*\*\}/);
  assert.match(rules, /request\.auth\s*!=\s*null\s*&&\s*request\.auth\.uid\s*==\s*userId/);
  assert.match(rules, /match\s+\/\{document=\*\*\}/);
  assert.match(rules, /allow\s+read,\s*write:\s*if\s+false;/);
});
