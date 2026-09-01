
import { Command, CornerDownLeft, Search } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { useEffect, useMemo, useState } from 'react';

import { Button, Input } from '../../ui/primitives';

export interface WorkspaceCommand {
  id: string;
  label: string;
  run: () => void;
}

interface CommandPaletteProps {
  commands: WorkspaceCommand[];
  onClose: () => void;
}

function rankCommands(commands: WorkspaceCommand[], query: string): WorkspaceCommand[] {
  const normalized = query.trim().toLowerCase();
  if (normalized === '') return commands;

  return commands
    .map((command) => {
      const label = command.label.toLowerCase();
      const score = label === normalized ? 0 : label.startsWith(normalized) ? 1 : label.includes(normalized) ? 2 : 3;
      return { command, score };
    })
    .filter((item) => item.score < 3)
    .sort((left, right) => left.score - right.score || left.command.label.localeCompare(right.command.label))
    .map((item) => item.command);
}

export function CommandPalette({ commands, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const visibleCommands = useMemo(() => rankCommands(commands, query), [commands, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function runCommand(command: WorkspaceCommand | undefined) {
    if (command === undefined) return;
    command.run();
    onClose();
  }

  return (
    <Dialog.Root open onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[1px]" />
        <Dialog.Content className="fixed left-1/2 top-14 z-[60] h-fit w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-cs-border bg-cs-panel shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Dialog.Description className="sr-only">Search and run Chatspace workspace commands.</Dialog.Description>
          <div className="flex h-10 items-center gap-2 border-b border-cs-border px-3">
            <Search size={14} className="shrink-0 text-cs-subtle" aria-hidden="true" />
            <Input
              autoFocus
              className="h-auto min-w-0 flex-1 border-0 bg-transparent px-0 text-xs text-cs-text shadow-none outline-none focus:border-transparent focus:ring-0"
              aria-label="Search commands"
              placeholder="Type a command"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setActiveIndex((current) => visibleCommands.length === 0 ? 0 : (current + 1) % visibleCommands.length);
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  setActiveIndex((current) => visibleCommands.length === 0 ? 0 : (current - 1 + visibleCommands.length) % visibleCommands.length);
                } else if (event.key === 'Enter') {
                  event.preventDefault();
                  runCommand(visibleCommands[activeIndex]);
                }
              }}
            />
            <kbd className="rounded border border-cs-border bg-cs-control px-1.5 py-0.5 text-[9px] text-cs-subtle">Esc</kbd>
          </div>
          <div className="max-h-[340px] overflow-y-auto p-1.5">
            {visibleCommands.map((command, index) => (
              <Button
                variant="ghost"
                size="md"
                aria-label={command.label}
                data-active={index === activeIndex ? 'true' : 'false'}
                className={index === activeIndex
                  ? 'h-8 w-full justify-between bg-cs-active px-2.5 text-left text-[11px] text-cs-text'
                  : 'h-8 w-full justify-between px-2.5 text-left text-[11px] text-cs-muted'}
                key={command.id}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => runCommand(command)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Command size={11} className="shrink-0 text-cs-subtle" aria-hidden="true" />
                  <span className="truncate">{command.label}</span>
                </span>
                {index === activeIndex && (
                  <kbd aria-hidden="true" className="flex items-center gap-1 text-[9px] text-cs-subtle">
                    Enter <CornerDownLeft size={9} />
                  </kbd>
                )}
              </Button>
            ))}
            {visibleCommands.length === 0 && (
              <p className="m-0 px-3 py-5 text-center text-[10px] text-cs-subtle">No matching commands.</p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
