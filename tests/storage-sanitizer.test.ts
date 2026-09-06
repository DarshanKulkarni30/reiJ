import test from "node:test";
import assert from "node:assert/strict";

// Helper replicated from server.ts to ensure standalone testability
function stripUndefined<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj, (_, val) => (val === undefined ? null : val)));
}

test("stripUndefined converts undefined values to null for safe Firestore storage", () => {
  const input = {
    id: "entry_123",
    mood: "Reflective",
    notes: undefined,
    deep: {
      nestedUndefined: undefined,
      validField: "Grounded",
    },
  };

  const sanitized = stripUndefined(input);

  assert.equal(sanitized.id, "entry_123");
  assert.equal(sanitized.mood, "Reflective");
  assert.equal(sanitized.notes, null);
  assert.equal(sanitized.deep.nestedUndefined, null);
  assert.equal(sanitized.deep.validField, "Grounded");
});

test("stripUndefined preserves arrays and numbers intact", () => {
  const input = {
    traits: ["Confidence", "Patience", "Discipline"],
    intensity: 4,
    tags: [undefined, "Focus"],
  };

  const sanitized = stripUndefined(input);

  assert.deepEqual(sanitized.traits, ["Confidence", "Patience", "Discipline"]);
  assert.equal(sanitized.intensity, 4);
  assert.equal(sanitized.tags[0], null);
  assert.equal(sanitized.tags[1], "Focus");
});
