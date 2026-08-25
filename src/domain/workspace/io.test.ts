import { describe, expect, it } from 'vitest';

import { createInitialWorkspace } from './model';
import { exportWorkspaceJson, importWorkspaceJson } from './io';

describe('workspace import/export', () => {
  it('round-trips a valid local workspace snapshot', () => {
    const snapshot = createInitialWorkspace(42);
    const restored = importWorkspaceJson(exportWorkspaceJson(snapshot));

    expect(restored).toEqual(snapshot);
  });

  it('rejects unknown schema versions and malformed payloads', () => {
    expect(() => importWorkspaceJson('{"schemaVersion":999}')).toThrow(/unsupported/i);
    expect(() => importWorkspaceJson('{"schemaVersion":1,"folders":"wrong"}')).toThrow(/invalid/i);
  });
});
