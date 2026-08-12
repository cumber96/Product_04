import type { BenefitAppId } from '../../../domain/benefits/types';
import type { AppLaunchSnapshot } from '../../../domain/benefits/confirmation';

/**
 * Separate key from completed-benefit-ids storage — snapshots capture
 * point-in-time launch state, not the ongoing completed set, so they must
 * not share persistence with it.
 */
const STORAGE_KEY = 'product04:app-launch-snapshots';

type SnapshotByApp = Partial<Record<BenefitAppId, AppLaunchSnapshot>>;

function loadAll(): SnapshotByApp {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    return parsed as SnapshotByApp;
  } catch {
    return {};
  }
}

/**
 * Stores the given snapshot as the latest launch for its app, keeping any
 * other apps' most recent snapshots untouched.
 */
export function saveAppLaunchSnapshot(snapshot: AppLaunchSnapshot): void {
  const all = loadAll();
  all[snapshot.appId] = snapshot;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function loadAppLaunchSnapshot(appId: BenefitAppId): AppLaunchSnapshot | null {
  return loadAll()[appId] ?? null;
}
