const CHATGPT_ORIGIN = 'https://chatgpt.com';
const CONVERSATION_PATH = /^\/c\/[A-Za-z0-9_-]+\/?$/;

export interface ChatGptCapability {
  supportedOrigin: boolean;
  canCaptureCurrentReference: boolean;
  currentTarget: string | null;
}

export function normalizeChatGptTarget(href: string): string | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }

  if (url.origin !== CHATGPT_ORIGIN || url.username !== '' || url.password !== '') {
    return null;
  }

  if (!CONVERSATION_PATH.test(url.pathname)) {
    return null;
  }

  const normalizedPath = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;
  return `${CHATGPT_ORIGIN}${normalizedPath}`;
}

export function getChatGptCapability(href: string): ChatGptCapability {
  let supportedOrigin = false;
  try {
    supportedOrigin = new URL(href).origin === CHATGPT_ORIGIN;
  } catch {
    supportedOrigin = false;
  }

  const currentTarget = normalizeChatGptTarget(href);
  return {
    supportedOrigin,
    canCaptureCurrentReference: currentTarget !== null,
    currentTarget,
  };
}

export function navigateToChatGptTarget(
  target: string,
  navigate: (url: string) => void = (url) => window.location.assign(url),
): void {
  const normalized = normalizeChatGptTarget(target);
  if (normalized === null) {
    throw new Error('Unsupported ChatGPT conversation target.');
  }
  navigate(normalized);
}
