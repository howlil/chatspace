
import { Pencil, X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { useEffect, useState } from 'react';

import { Button, IconButton, Input } from './primitives';

interface TextInputDialogProps {
  open: boolean;
  title: string;
  description?: string | undefined;
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

  const normalized = value.trim();

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onCancel(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[1px]" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[60] w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-cs-border bg-cs-panel shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
          aria-describedby={description === undefined ? undefined : 'text-input-dialog-description'}
        >
          <header className="flex items-start gap-3 border-b border-cs-border px-4 py-3.5">
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-cs-border bg-cs-surface text-cs-muted">
              <Pencil size={14} strokeWidth={1.7} aria-hidden="true" />
            </span>
            <div className="grid min-w-0 flex-1 gap-0.5">
              <Dialog.Title asChild>
                <strong className="text-xs font-semibold">{title}</strong>
              </Dialog.Title>
              {description !== undefined && (
                <Dialog.Description asChild>
                  <p id="text-input-dialog-description" className="m-0 text-[10px] leading-4 text-cs-muted">{description}</p>
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <IconButton className="-mr-1 -mt-1 text-cs-subtle" aria-label={`Close ${title}`}>
                <X size={13} aria-hidden="true" />
              </IconButton>
            </Dialog.Close>
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
              <Dialog.Close asChild>
                <Button variant="ghost">Cancel</Button>
              </Dialog.Close>
              <Button variant="primary" type="submit" disabled={normalized === ''}>{confirmLabel}</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
