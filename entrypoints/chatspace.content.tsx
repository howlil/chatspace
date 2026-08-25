import { createRoot, type Root } from 'react-dom/client';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';

import { BootstrapShell } from '../src/app/shell/BootstrapShell';

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
      onRemove(root: Root | undefined) {
        root?.unmount();
      },
    });

    ui.mount();
  },
});
