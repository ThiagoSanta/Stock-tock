import test from 'node:test';
import assert from 'node:assert/strict';

test('Smoke test Node native test runner', () => {
  assert.equal(1 + 1, 2);
});
