import type { LocalNote } from '../../domain/workspace/model';

export const LOCAL_BRIDGE_ORIGIN = 'http://127.0.0.1:27123';
export const LOCAL_BRIDGE_ORIGIN_PATTERN = `${LOCAL_BRIDGE_ORIGIN}/*`;

export interface BridgeWriteResult {
  path: string;
}

export interface LocalVaultBridge {
  health(token: string): Promise<void>;
  writeNote(token: string, note: LocalNote): Promise<BridgeWriteResult>;
}

function bridgeError(status: number): Error {
  return new Error(`Local vault bridge request failed with status ${status}.`);
}

function isWriteResult(value: unknown): value is BridgeWriteResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'path' in value &&
    typeof (value as { path?: unknown }).path === 'string'
  );
}

export class HttpLocalVaultBridge implements LocalVaultBridge {
  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  async health(token: string): Promise<void> {
    const response = await this.fetchImpl(`${LOCAL_BRIDGE_ORIGIN}/health`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw bridgeError(response.status);
    }
  }

  async writeNote(token: string, note: LocalNote): Promise<BridgeWriteResult> {
    const response = await this.fetchImpl(`${LOCAL_BRIDGE_ORIGIN}/notes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: note.id, title: note.title, markdown: note.content }),
    });
    if (!response.ok) {
      throw bridgeError(response.status);
    }
    const payload: unknown = await response.json();
    if (!isWriteResult(payload)) {
      throw new Error('Local vault bridge returned an invalid response.');
    }
    return payload;
  }
}
