
import { useEffect, useState } from 'react';

import type { LocalNote } from '../../domain/workspace/model';
import type { LocalVault, VaultConnection } from '../../integrations/local-vault/BrowserLocalVault';
import type { VaultPageState } from './LocalVaultPage';

interface UseLocalVaultControllerInput {
  localVault: LocalVault | undefined;
  onStatus: (message: string) => void;
}

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : 'Local operation failed.';
}

function vaultStateFor(connection: VaultConnection | null): VaultPageState {
  if (connection === null) return 'disconnected';
  return connection.permission === 'granted' ? 'connected' : 'permission-required';
}

export function useLocalVaultController({ localVault, onStatus }: UseLocalVaultControllerInput) {
  const [state, setState] = useState<VaultPageState>('loading');
  const [connection, setConnection] = useState<VaultConnection | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (localVault === undefined || !localVault.isSupported()) {
        if (!cancelled) {
          setConnection(null);
          setState('unsupported');
          setMessage(null);
        }
        return;
      }

      try {
        const savedConnection = await localVault.getConnection();
        if (cancelled) return;
        setConnection(savedConnection);
        setState(vaultStateFor(savedConnection));
        setMessage(null);
      } catch (error) {
        if (cancelled) return;
        setConnection(null);
        setState('error');
        setMessage(messageFromError(error));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [localVault]);

  function applyConnection(nextConnection: VaultConnection | null): void {
    setConnection(nextConnection);
    setState(vaultStateFor(nextConnection));
  }

  async function connect(): Promise<void> {
    if (localVault === undefined || !localVault.isSupported()) {
      setConnection(null);
      setState('unsupported');
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const nextConnection = await localVault.connect();
      if (nextConnection !== null) applyConnection(nextConnection);
    } catch (error) {
      setState('error');
      setMessage(messageFromError(error));
    } finally {
      setBusy(false);
    }
  }

  async function reconnect(): Promise<void> {
    if (localVault === undefined) return;

    setBusy(true);
    setMessage(null);
    try {
      applyConnection(await localVault.reconnect());
    } catch (error) {
      setState('error');
      setMessage(messageFromError(error));
    } finally {
      setBusy(false);
    }
  }

  async function disconnect(): Promise<void> {
    if (localVault === undefined) return;

    setBusy(true);
    setMessage(null);
    try {
      await localVault.disconnect();
      setConnection(null);
      setState('disconnected');
    } catch (error) {
      setState('error');
      setMessage(messageFromError(error));
    } finally {
      setBusy(false);
    }
  }

  async function syncNote(note: LocalNote): Promise<void> {
    if (localVault === undefined) {
      setState('unsupported');
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const result = await localVault.writeNote(note);
      onStatus(`Synced note to ${result.path}.`);
      setMessage(`Synced to ${result.path}`);
      applyConnection(await localVault.getConnection());
    } catch (error) {
      setMessage(messageFromError(error));
      try {
        const currentConnection = await localVault.getConnection();
        setConnection(currentConnection);
        setState(currentConnection !== null && currentConnection.permission !== 'granted' ? 'permission-required' : 'error');
      } catch {
        setState('error');
      }
    } finally {
      setBusy(false);
    }
  }

  return {
    state,
    connection,
    message,
    busy,
    connect,
    reconnect,
    disconnect,
    syncNote,
  };
}
