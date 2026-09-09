const CHATGPT_ORIGIN = 'https://chatgpt.com';
const CONVERSATION_PATH = /^\/c\/[A-Za-z0-9_-]+\/?$/;

export function normalizeChatGptTarget(href: string): string | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }

  if (url.origin !== CHATGPT_ORIGIN || url.username !== '' || url.password !== '') return null;
  if (!CONVERSATION_PATH.test(url.pathname)) return null;

  const normalizedPath = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;
  return `${CHATGPT_ORIGIN}${normalizedPath}`;
}
