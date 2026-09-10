import type { TurnSnapshot } from './graphEngine';

export function promptIdentity(snapshot: Pick<TurnSnapshot, 'promptKey'>): string | null {
  const value = snapshot.promptKey?.trim();
  return value ? `user:${value}` : null;
}

export function responseIdentity(snapshot: Pick<TurnSnapshot, 'responseKey'>): string | null {
  const value = snapshot.responseKey?.trim();
  return value ? `assistant:${value}` : null;
}

export function snapshotIdentityAliases(snapshot: Pick<TurnSnapshot, 'promptKey' | 'responseKey'>): string[] {
  const aliases = [promptIdentity(snapshot), responseIdentity(snapshot)].filter((value): value is string => value !== null);
  return aliases;
}
