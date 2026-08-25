import { createShadowRootUi, defineContentScript } from '#imports';
import { createRoot } from 'react-dom/client';

import { BootstrapShell } from '../src/app/shell/BootstrapShell';
import '../src/app/shell/bootstrap-shell.css';

export default defineContentScript({
  matches: ['https://chatgpt.com/*'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'chatspace-root',
      position: 'inline',
      anchor: 'body',
      onMount(container) {
        const root = createRoot(container);
        root.render(<BootstrapShell />);
        return root;
      },
      onRemove(root) {
        root?.unmount();
      },
    });

    ui.mount();
  },
});
