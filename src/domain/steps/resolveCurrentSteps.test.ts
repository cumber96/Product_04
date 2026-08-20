import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveCurrentSteps, resolveTrustedStoredSteps, type DatedStoredSteps } from './resolveCurrentSteps.ts';

test('resolveCurrentSteps: url value always wins when present, including 0', () => {
  assert.equal(resolveCurrentSteps(0, 9800), 0);
  assert.equal(resolveCurrentSteps(120, 9800), 120);
});

test('resolveCurrentSteps: falls back to lastKnown only when url is null', () => {
  assert.equal(resolveCurrentSteps(null, 9800), 9800);
  assert.equal(resolveCurrentSteps(null, null), null);
});

test('resolveTrustedStoredSteps: same-date record passes through', () => {
  const stored: DatedStoredSteps = { date: '2026-08-20', steps: 5000, iphoneSteps: 3000 };
  assert.deepEqual(resolveTrustedStoredSteps(stored, '2026-08-20'), stored);
});

test('resolveTrustedStoredSteps: prior-day record is rejected, not used as fallback', () => {
  const stored: DatedStoredSteps = { date: '2026-08-19', steps: 9800, iphoneSteps: 9800 };
  assert.equal(resolveTrustedStoredSteps(stored, '2026-08-20'), null);
});

test('resolveTrustedStoredSteps: legacy record with no date (empty string) is rejected', () => {
  const stored: DatedStoredSteps = { date: '', steps: 9800, iphoneSteps: 9800 };
  assert.equal(resolveTrustedStoredSteps(stored, '2026-08-20'), null);
});

test('resolveTrustedStoredSteps: null stored stays null', () => {
  assert.equal(resolveTrustedStoredSteps(null, '2026-08-20'), null);
});

/**
 * These replicate useLatestSteps.ts's exact read-path composition
 * (resolveTrustedStoredSteps -> resolveCurrentSteps) for the scenarios from
 * the midnight-rollover investigation, without going through React/DOM.
 */
function resolveLatestSteps(
  urlSteps: number | null,
  urlIphoneSteps: number | null,
  stored: DatedStoredSteps | null,
  today: string,
) {
  const trusted = resolveTrustedStoredSteps(stored, today);
  return {
    steps: resolveCurrentSteps(urlSteps, trusted?.steps ?? null),
    iphoneSteps: resolveCurrentSteps(urlIphoneSteps, trusted?.iphoneSteps ?? null),
  };
}

test('scenario A: yesterday steps=9800/iphoneSteps=9800 in storage, today URL steps=0/no iphoneSteps -> steps 0, iphoneSteps not the stale 9800', () => {
  const stored: DatedStoredSteps = { date: '2026-08-19', steps: 9800, iphoneSteps: 9800 };
  const result = resolveLatestSteps(0, null, stored, '2026-08-20');
  assert.equal(result.steps, 0);
  assert.notEqual(result.iphoneSteps, 9800);
  assert.equal(result.iphoneSteps, null);
});

test('scenario B: same-day stored values fall back when URL carries no params', () => {
  const stored: DatedStoredSteps = { date: '2026-08-20', steps: 5000, iphoneSteps: 3000 };
  const result = resolveLatestSteps(null, null, stored, '2026-08-20');
  assert.equal(result.steps, 5000);
  assert.equal(result.iphoneSteps, 3000);
});

test('scenario C: url steps=0 and iphoneSteps=0 both resolve to exactly 0, not stored fallback', () => {
  const stored: DatedStoredSteps = { date: '2026-08-20', steps: 5000, iphoneSteps: 3000 };
  const result = resolveLatestSteps(0, 0, stored, '2026-08-20');
  assert.equal(result.steps, 0);
  assert.equal(result.iphoneSteps, 0);
});

test('scenario D: legacy stored record with no date is never used as a fallback for a new day', () => {
  const legacyStored: DatedStoredSteps = { date: '', steps: 9800, iphoneSteps: 9800 };
  const result = resolveLatestSteps(0, null, legacyStored, '2026-08-20');
  assert.equal(result.steps, 0);
  assert.equal(result.iphoneSteps, null);
});
