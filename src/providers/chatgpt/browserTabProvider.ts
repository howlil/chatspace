import { normalizeChatGptTarget } from './adapter';

export interface ProviderTab {
  id: number | undefined;
  url: string | undefined;
}

export interface ProviderTabsPort {
  getActive(): Promise<ProviderTab | undefined>;
  update(tabId: number, url: string): Promise<void>;
  create(url: string): Promise<void>;
}

export type ProviderTabState =
  | { kind: 'conversation'; url: string; target: string }
  | { kind: 'chatgpt'; url: string }
  | { kind: 'unavailable'; url: string | null };

export function classifyProviderTab(tab: ProviderTab | undefined): ProviderTabState {
  const url = tab?.url ?? null;
  if (url === null) return { kind: 'unavailable', url: null };

  const target = normalizeChatGptTarget(url);
  if (target !== null) return { kind: 'conversation', url, target };

  try {
    const parsed = new URL(url);
    if (parsed.origin === 'https://chatgpt.com') return { kind: 'chatgpt', url };
  } catch {
    return { kind: 'unavailable', url };
  }

  return { kind: 'unavailable', url };
}

export async function readActiveProviderState(port: ProviderTabsPort): Promise<ProviderTabState> {
  return classifyProviderTab(await port.getActive());
}

export async function navigateActiveProvider(port: ProviderTabsPort, target: string): Promise<void> {
  const normalized = normalizeChatGptTarget(target);
  if (normalized === null) throw new Error('Unsupported ChatGPT conversation target.');

  const tab = await port.getActive();
  const state = classifyProviderTab(tab);

  if (tab?.id !== undefined && state.kind !== 'unavailable') {
    await port.update(tab.id, normalized);
    return;
  }

  await port.create(normalized);
}
