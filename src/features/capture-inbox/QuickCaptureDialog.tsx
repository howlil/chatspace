import { Inbox } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { useEffect, useRef, useState } from 'react';

import { Button } from '../../ui/primitives';

interface QuickCaptureDialogProps {
  open: boolean;
  linkedChatLabel: string | null;
  onSave: (content: string) => void;
  onClose: () => void;
}

export function QuickCaptureDialog({ open, linkedChatLabel, onSave, onClose }: QuickCaptureDialogProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!open) {
      setContent('');
      return;
    }
    window.requestAnimationFrame(() => textareaRef.current?.focus());
  }, [open]);

  function save(): void {
    const value = content.trim();
    if (value === '') return;
    onSave(value);
    setContent('');
  }

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35" />
        <Dialog.Content
          className="fixed left-1/2 top-[22%] z-50 grid w-[min(92vw,520px)] -translate-x-1/2 gap-2 rounded-xl border border-cs-border bg-cs-surface p-2 shadow-2xl outline-none"
          aria-describedby="quick-capture-description"
        >
          <div className="flex items-center gap-2 px-1 py-0.5">
            <span className="grid size-7 place-items-center rounded-md border border-cs-border bg-cs-panel text-cs-muted"><Inbox size={13} aria-hidden="true" /></span>
            <div className="grid min-w-0 gap-0.5">
              <Dialog.Title className="text-[11px] font-medium text-cs-text">Quick capture</Dialog.Title>
              <Dialog.Description id="quick-capture-description" className="text-[9px] text-cs-subtle">
                Save to Inbox{linkedChatLabel === null ? '.' : ` · linked to ${linkedChatLabel}.`}
              </Dialog.Description>
            </div>
          </div>
          <textarea
            ref={textareaRef}
            aria-label="Quick capture"
            className="min-h-28 w-full resize-none rounded-lg border border-cs-border bg-cs-bg px-3 py-2 text-[12px] leading-5 text-cs-text outline-none placeholder:text-cs-subtle focus:border-cs-focus/60"
            placeholder="Capture a thought…"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                save();
              }
            }}
          />
          <div className="flex items-center justify-between gap-3 px-1 pb-0.5">
            <span className="text-[8px] text-cs-subtle">Enter to save · Shift+Enter for newline</span>
            <div className="flex gap-1.5">
              <Dialog.Close asChild><Button variant="ghost" size="sm">Cancel</Button></Dialog.Close>
              <Button size="sm" disabled={content.trim() === ''} onClick={save}>Save to Inbox</Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
