import { FilePlus2, FolderPlus, Inbox, PanelLeftClose, Plus } from 'lucide-react';
import { DropdownMenu } from 'radix-ui';
import type { ReactNode } from 'react';

import { cn } from '../../ui/cn';
import { IconButton } from '../../ui/primitives';

function CreateItem({ icon, children, onSelect }: { icon: ReactNode; children: ReactNode; onSelect: () => void }) {
  return (
    <DropdownMenu.Item
      className="flex h-8 cursor-default items-center gap-2 rounded px-2 text-[10px] text-cs-muted outline-none data-[highlighted]:bg-cs-hover data-[highlighted]:text-cs-text"
      onSelect={onSelect}
    >
      {icon}
      <span>{children}</span>
    </DropdownMenu.Item>
  );
}

interface LibraryHeaderProps {
  onCreateNote: () => void;
  onCreateFolder: () => void;
  onQuickCapture: () => void;
  onCollapse: () => void;
  className?: string;
}

export function LibraryHeader({
  onCreateNote,
  onCreateFolder,
  onQuickCapture,
  onCollapse,
  className,
}: LibraryHeaderProps) {
  return (
    <header className={cn('flex h-9 items-center gap-2 border-b border-cs-border px-2', className)}>
      <strong className="min-w-0 flex-1 truncate text-[10px] font-medium text-cs-text">Library</strong>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <IconButton className="size-6 text-cs-subtle" aria-label="Create in library" title="Create in library">
            <Plus size={12} aria-hidden="true" />
          </IconButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={4}
            className="z-50 min-w-40 rounded-md border border-cs-border bg-cs-panel p-1 shadow-lg"
          >
            <CreateItem icon={<FilePlus2 size={12} aria-hidden="true" />} onSelect={onCreateNote}>New note</CreateItem>
            <CreateItem icon={<FolderPlus size={12} aria-hidden="true" />} onSelect={onCreateFolder}>New folder</CreateItem>
            <DropdownMenu.Separator className="my-1 h-px bg-cs-border" />
            <CreateItem icon={<Inbox size={12} aria-hidden="true" />} onSelect={onQuickCapture}>Quick capture</CreateItem>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <IconButton className="size-6 text-cs-subtle" aria-label="Collapse library" title="Collapse library" onClick={onCollapse}>
        <PanelLeftClose size={13} aria-hidden="true" />
      </IconButton>
    </header>
  );
}
