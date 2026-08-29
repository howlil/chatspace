import { AlertTriangle, X } from 'lucide-react';
import { useEffect } from 'react';

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
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-3 backdrop-blur-[1px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        className="w-full max-w-sm overflow-hidden rounded-xl border border-cs-border bg-cs-panel shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="flex items-start gap-3 border-b border-cs-border px-4 py-3.5">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-red-400/15 bg-red-500/[0.06] text-cs-danger">
            <AlertTriangle size={14} strokeWidth={1.7} aria-hidden="true" />
          </span>
          <div className="grid min-w-0 flex-1 gap-0.5">
            <strong className="text-xs font-semibold">{title}</strong>
            <p className="m-0 text-[10px] leading-4 text-cs-muted">{description}</p>
          </div>
          <IconButton className="-mr-1 -mt-1 text-cs-subtle" aria-label={`Close ${title}`} onClick={onCancel}>
            <X size={13} aria-hidden="true" />
          </IconButton>
        </header>

        <footer className="flex items-center justify-end gap-2 bg-cs-surface/60 px-4 py-3">
          <Button variant="ghost" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
        </footer>
      </section>
    </div>
  );
}
