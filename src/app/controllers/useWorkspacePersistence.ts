
import { useEffect, useState, type Dispatch } from 'react';

import { importWorkspaceJson } from '../../domain/workspace/io';
import { createInitialWorkspace, type WorkspaceSnapshot } from '../../domain/workspace/model';
import type { WorkspaceAction } from '../../domain/workspace/workspaceReducer';
import type { WorkspaceRepository } from '../../persistence/workspaceRepository';

type PersistenceState = 'loading' | 'ready' | 'blocked';

interface UseWorkspacePersistenceInput {
  repository: WorkspaceRepository;
  workspace: WorkspaceSnapshot;
  dispatch: Dispatch<WorkspaceAction>;
  onResetSelection: () => void;
  onStatus: (message: string) => void;
}

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : 'Local operation failed.';
}

function recoveryText(raw: unknown | null): string | null {
  if (raw === null) return null;
  try {
    return JSON.stringify(raw, null, 2);
  } catch {
    return String(raw);
  }
}

async function readRecovery(repository: WorkspaceRepository): Promise<string | null> {
  try {
    return recoveryText(await repository.readRaw());
  } catch {
    return null;
  }
}

export function useWorkspacePersistence({
  repository,
  workspace,
  dispatch,
  onResetSelection,
  onStatus,
}: UseWorkspacePersistenceInput) {
  const [persistenceState, setPersistenceState] = useState<PersistenceState>('loading');
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [recoveryJson, setRecoveryJson] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const saved = await repository.load();
        if (cancelled) return;
        if (saved !== null) dispatch({ type: 'workspace/replace', snapshot: saved });
        setPersistenceState('ready');
      } catch (error) {
        if (cancelled) return;
        setRecoveryJson(await readRecovery(repository));
        setPersistenceError(`Storage recovery required. ${messageFromError(error)}`);
        setPersistenceState('blocked');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch, repository]);

  useEffect(() => {
    if (persistenceState !== 'ready') return;
    void repository.save(workspace).catch(async (error) => {
      setRecoveryJson(await readRecovery(repository));
      setPersistenceError(`Saving was blocked. ${messageFromError(error)}`);
      setPersistenceState('blocked');
    });
  }, [persistenceState, repository, workspace]);

  async function importBackup(json: string): Promise<void> {
    const snapshot = importWorkspaceJson(json);
    try {
      await repository.save(snapshot);
      dispatch({ type: 'workspace/replace', snapshot });
      setPersistenceError(null);
      setRecoveryJson(null);
      setPersistenceState('ready');
      onStatus('Backup imported.');
    } catch (error) {
      setPersistenceError(`Import could not be saved. ${messageFromError(error)}`);
      setPersistenceState('blocked');
      throw error;
    }
  }

  async function resetLocalData(): Promise<void> {
    try {
      await repository.clear();
      const reset = createInitialWorkspace();
      dispatch({ type: 'workspace/replace', snapshot: reset });
      onResetSelection();
      setPersistenceError(null);
      setRecoveryJson(null);
      setPersistenceState('ready');
      onStatus('Local workspace reset.');
    } catch (error) {
      setPersistenceError(`Reset failed. ${messageFromError(error)}`);
      setPersistenceState('blocked');
      throw error;
    }
  }

  return {
    persistenceError,
    recoveryJson,
    importBackup,
    resetLocalData,
  };
}
