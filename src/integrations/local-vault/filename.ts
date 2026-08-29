export function safeVaultSegment(value: string, fallback: string): string {
  const normalized = value
    .normalize('NFKC')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 80);

  return normalized === '' ? fallback : normalized;
}

export function noteFilename(title: string, id: string): string {
  return `${safeVaultSegment(title, 'Untitled')}-${safeVaultSegment(id, 'note')}.md`;
}
