
import { AlertTriangle, X } from 'lucide-react';
import { AlertDialog } from 'radix-ui';

import { Button, IconButton } from './primitives';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onCancel(); }}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[1px]"
          onPointerDown={onCancel}
        />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[60] w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-cs-border bg-cs-panel shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <header className="flex items-start gap-3 border-b border-cs-border px-4 py-3.5">
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-red-400/15 bg-red-500/[0.06] text-cs-danger">
              <AlertTriangle size={14} strokeWidth={1.7} aria-hidden="true" />
            </span>
            <div className="grid min-w-0 flex-1 gap-0.5">
              <AlertDialog.Title asChild>
                <strong className="text-xs font-semibold">{title}</strong>
              </AlertDialog.Title>
              <AlertDialog.Description asChild>
                <p className="m-0 text-[10px] leading-4 text-cs-muted">{description}</p>
              </AlertDialog.Description>
            </div>
            <AlertDialog.Cancel asChild>
              <IconButton className="-mr-1 -mt-1 text-cs-subtle" aria-label={`Close ${title}`}>
                <X size={13} aria-hidden="true" />
              </IconButton>
            </AlertDialog.Cancel>
          </header>

          <footer className="flex items-center justify-end gap-2 bg-cs-surface/60 px-4 py-3">
            <AlertDialog.Cancel asChild>
              <Button variant="ghost">{cancelLabel}</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
            </AlertDialog.Action>
          </footer>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
