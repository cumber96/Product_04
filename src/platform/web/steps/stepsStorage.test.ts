import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { loadStoredSteps, saveStoredSteps } from './stepsStorage.ts';

/**
 * Minimal in-memory localStorage polyfill — this suite runs under Node's
 * built-in test runner (no jsdom/browser environment available), and
 * stepsStorage.ts talks to the ambient `localStorage` global directly.
 */
class FakeLocalStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: FakeLocalStorage }).localStorage = new FakeLocalStorage();
});

test('saveStoredSteps/loadStoredSteps round-trip includes date', () => {
  saveStoredSteps(5000, 3000, '2026-08-20', '2026-08-20T01:00:00.000Z');
  const stored = loadStoredSteps();
  assert.deepEqual(stored, {
    date: '2026-08-20',
    steps: 5000,
    iphoneSteps: 3000,
    updatedAt: '2026-08-20T01:00:00.000Z',
  });
});

test('loadStoredSteps returns null when nothing stored', () => {
  assert.equal(loadStoredSteps(), null);
});

test('loadStoredSteps returns null on malformed JSON without throwing', () => {
  localStorage.setItem('product04:latest-steps', '{not json');
  assert.doesNotThrow(() => loadStoredSteps());
  assert.equal(loadStoredSteps(), null);
});

test('loadStoredSteps treats a legacy record with no date field as date: "" (never trusted as today)', () => {
  localStorage.setItem(
    'product04:latest-steps',
    JSON.stringify({ steps: 9800, iphoneSteps: 9800, updatedAt: '2026-08-19T10:00:00.000Z' }),
  );
  const stored = loadStoredSteps();
  assert.equal(stored?.date, '');
  assert.equal(stored?.steps, 9800);
});

test('loadStoredSteps still defaults iphoneSteps to null for pre-iphoneSteps legacy records', () => {
  localStorage.setItem(
    'product04:latest-steps',
    JSON.stringify({ date: '2026-08-20', steps: 6427, updatedAt: '2026-08-20T10:00:00.000Z' }),
  );
  const stored = loadStoredSteps();
  assert.equal(stored?.iphoneSteps, null);
  assert.equal(stored?.date, '2026-08-20');
});
