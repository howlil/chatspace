import { useMemo, useState } from 'react';

export interface WorkspaceCommand {
  id: string;
  label: string;
  run: () => void;
}

interface CommandPaletteProps {
  commands: WorkspaceCommand[];
  onClose: () => void;
}

export function CommandPalette({ commands, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const visibleCommands = useMemo(
    () =>
      normalizedQuery.length === 0
        ? commands
        : commands.filter((command) => command.label.toLowerCase().includes(normalizedQuery)),
    [commands, normalizedQuery],
  );

  return (
    <div className="command-palette-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <input
          autoFocus
          aria-label="Search commands"
          placeholder="Type a command"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              onClose();
            }
          }}
        />
        <div className="command-palette__list">
          {visibleCommands.map((command) => (
            <button
              type="button"
              key={command.id}
              onClick={() => {
                command.run();
                onClose();
              }}
            >
              {command.label}
            </button>
          ))}
          {visibleCommands.length === 0 && <p>No matching commands.</p>}
        </div>
      </section>
    </div>
  );
}
