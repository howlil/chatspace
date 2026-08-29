import { Pencil, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, IconButton, Input } from './primitives';

interface TextInputDialogProps {
  open: boolean;
  title: string;
  description?: string;
  label: string;
  initialValue: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function TextInputDialog({
  open,
  title,
  description,
  label,
  initialValue,
  confirmLabel = 'Save',
  onConfirm,
  onCancel,
}: TextInputDialogProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [initialValue, open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel, open]);

  if (!open) return null;

  const normalized = value.trim();

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
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="flex items-start gap-3 border-b border-cs-border px-4 py-3.5">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-cs-border bg-cs-surface text-cs-muted">
            <Pencil size={14} strokeWidth={1.7} aria-hidden="true" />
          </span>
          <div className="grid min-w-0 flex-1 gap-0.5">
            <strong className="text-xs font-semibold">{title}</strong>
            {description !== undefined && <p className="m-0 text-[10px] leading-4 text-cs-muted">{description}</p>}
          </div>
          <IconButton className="-mr-1 -mt-1 text-cs-subtle" aria-label={`Close ${title}`} onClick={onCancel}>
            <X size={13} aria-hidden="true" />
          </IconButton>
        </header>

        <form
          className="grid gap-3 px-4 py-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (normalized !== '') onConfirm(normalized);
          }}
        >
          <label className="grid gap-1.5">
            <span className="text-[10px] font-medium text-cs-muted">{label}</span>
            <Input autoFocus aria-label={label} value={value} onChange={(event) => setValue(event.target.value)} />
          </label>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={normalized === ''}>{confirmLabel}</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
