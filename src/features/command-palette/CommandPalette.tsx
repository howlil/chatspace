import { useEffect, useMemo, useState } from 'react';

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
    <div className="command-palette-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="command-palette" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={(event) => event.stopPropagation()}>
        <input
          autoFocus
          aria-label="Search commands"
          placeholder="Type a command"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') onClose();
            else if (event.key === 'ArrowDown') {
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
        <div className="command-palette__list">
          {visibleCommands.map((command, index) => (
            <button type="button" data-active={index === activeIndex ? 'true' : 'false'} key={command.id} onMouseEnter={() => setActiveIndex(index)} onClick={() => runCommand(command)}>
              <span>{command.label}</span>
              {index === activeIndex && <kbd>Enter</kbd>}
            </button>
          ))}
          {visibleCommands.length === 0 && <p>No matching commands.</p>}
        </div>
      </section>
    </div>
  );
}
