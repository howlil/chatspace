import { browser } from 'wxt/browser';

import { LOCAL_BRIDGE_ORIGIN_PATTERN } from './bridge';

export async function requestLocalBridgePermission(): Promise<boolean> {
  return browser.permissions.request({ origins: [LOCAL_BRIDGE_ORIGIN_PATTERN] });
}
