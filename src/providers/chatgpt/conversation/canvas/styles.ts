import { CANVAS_ID, NODE_ATTRIBUTE, SOURCE_ATTRIBUTE } from './dom';
import { CARD_HEIGHT, CARD_WIDTH } from './layout';

export const CANVAS_CSS = `
:root {
  --chatspace-accent: #3978f6;
  --chatspace-accent-soft: color-mix(in srgb, var(--chatspace-accent) 10%, transparent);
  --chatspace-border: color-mix(in srgb, currentColor 11%, transparent);
  --chatspace-border-strong: color-mix(in srgb, currentColor 19%, transparent);
  --chatspace-muted: color-mix(in srgb, currentColor 58%, transparent);
  --chatspace-surface: color-mix(in srgb, var(--main-surface-primary, Canvas) 97%, currentColor 3%);
  --chatspace-panel: color-mix(in srgb, var(--main-surface-primary, Canvas) 98%, currentColor 2%);
  --chatspace-ease: cubic-bezier(.22, 1, .36, 1);
  --chatspace-space-1: 4px;
  --chatspace-space-2: 8px;
  --chatspace-space-3: 12px;
  --chatspace-space-4: 16px;
  --chatspace-space-5: 20px;
  --chatspace-radius-sm: 8px;
  --chatspace-radius-md: 12px;
  --chatspace-radius-lg: 16px;
  --chatspace-control-height: 30px;
  --chatspace-shadow-float: 0 8px 24px rgb(0 0 0 / .055);
}

html[data-chatspace-canvas-active="true"],
html[data-chatspace-canvas-active="true"] body {
  height: 100%;
  overflow: hidden !important;
  overscroll-behavior: none;
}

[${SOURCE_ATTRIBUTE}="true"] { display: none !important; }

#${CANVAS_ID} {
  position: relative;
  width: 100%;
  height: 100dvh;
  max-height: 100dvh;
  min-height: 0;
  overflow: hidden;
  overscroll-behavior: none;
  isolation: isolate;
  contain: layout paint size;
  border-block: 1px solid var(--chatspace-border);
  background:
    radial-gradient(circle, color-mix(in srgb, currentColor 8%, transparent) 1px, transparent 1px),
    color-mix(in srgb, var(--main-surface-primary, Canvas) 99%, currentColor 1%);
  background-size: 24px 24px;
  color: inherit;
  user-select: none;
}

#${CANVAS_ID} [data-chatspace-viewport] {
  position: absolute;
  inset: 0;
  overflow: hidden;
  overscroll-behavior: none;
  touch-action: none;
  cursor: grab;
}
#${CANVAS_ID}[data-chatspace-panning="true"] [data-chatspace-viewport] { cursor: grabbing; }
#${CANVAS_ID} [data-chatspace-scene] {
  position: absolute;
  inset: 0 auto auto 0;
  width: 1px;
  height: 1px;
  transform-origin: 0 0;
  will-change: transform;
}
#${CANVAS_ID} [data-chatspace-edges] {
  position: absolute;
  inset: 0;
  overflow: visible;
  pointer-events: none;
}
#${CANVAS_ID} [data-chatspace-edge] {
  fill: none;
  stroke: color-mix(in srgb, currentColor 20%, transparent);
  stroke-width: 1.35;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}
#${CANVAS_ID} [data-chatspace-edge][data-chatspace-path="active"] {
  stroke: color-mix(in srgb, var(--chatspace-accent) 78%, currentColor 22%);
  stroke-width: 1.9;
  opacity: .95;
}
#${CANVAS_ID} [data-chatspace-edge][data-chatspace-path="inactive"] { opacity: .3; }
#${CANVAS_ID} [data-chatspace-edge][data-chatspace-branch="true"] { stroke-dasharray: 5 5; }

#${CANVAS_ID} [${NODE_ATTRIBUTE}] {
  position: absolute;
  width: ${CARD_WIDTH}px;
  height: ${CARD_HEIGHT}px;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  gap: 7px;
  padding: 12px 13px 11px;
  overflow: hidden;
  contain: layout paint style;
  content-visibility: auto;
  contain-intrinsic-size: ${CARD_WIDTH}px ${CARD_HEIGHT}px;
  border: 1px solid var(--chatspace-border);
  border-radius: var(--chatspace-radius-lg);
  background: var(--chatspace-surface);
  box-shadow: 0 1px 2px rgb(0 0 0 / .035), 0 8px 24px rgb(0 0 0 / .045);
  color: inherit;
  cursor: grab;
  user-select: text;
  transition: border-color 160ms ease, box-shadow 180ms ease, opacity 160ms ease;
  animation: chatspace-node-enter 180ms var(--chatspace-ease) both;
}
#${CANVAS_ID} [${NODE_ATTRIBUTE}][data-chatspace-dragging="true"] {
  z-index: 8;
  cursor: grabbing;
  transition: none;
  animation: none;
  box-shadow: 0 14px 34px rgb(0 0 0 / .09);
}
#${CANVAS_ID} [${NODE_ATTRIBUTE}][data-chatspace-path="inactive"] { opacity: .58; }
#${CANVAS_ID} [${NODE_ATTRIBUTE}][data-chatspace-selected="true"] {
  border-color: color-mix(in srgb, var(--chatspace-accent) 82%, transparent);
  box-shadow: 0 0 0 2px var(--chatspace-accent-soft), 0 10px 30px rgb(0 0 0 / .07);
}
#${CANVAS_ID} [${NODE_ATTRIBUTE}][data-chatspace-streaming="true"] {
  border-color: color-mix(in srgb, var(--chatspace-accent) 56%, transparent);
}
#${CANVAS_ID} [${NODE_ATTRIBUTE}][data-chatspace-search-match="false"] { opacity: .14; }
#${CANVAS_ID} [${NODE_ATTRIBUTE}]:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--chatspace-accent) 78%, white 22%);
  outline-offset: 3px;
}
@media (hover: hover) and (pointer: fine) {
  #${CANVAS_ID} [${NODE_ATTRIBUTE}]:hover {
    border-color: var(--chatspace-border-strong);
    box-shadow: 0 12px 28px rgb(0 0 0 / .065);
  }
}

#${CANVAS_ID} [data-chatspace-card-header] {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 20px;
  font-size: 11px;
}
#${CANVAS_ID} [data-chatspace-card-title] { margin-right: auto; font-size: 12px; font-weight: 650; }
#${CANVAS_ID} [data-chatspace-status-dot] {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--chatspace-accent);
  box-shadow: 0 0 0 3px var(--chatspace-accent-soft);
}
#${CANVAS_ID} [data-chatspace-streaming="true"] [data-chatspace-status-dot] { animation: chatspace-pulse 1.4s ease-in-out infinite; }
#${CANVAS_ID} [data-chatspace-badge] {
  max-width: 96px;
  padding: 3px 7px;
  overflow: hidden;
  border-radius: 999px;
  background: color-mix(in srgb, currentColor 6%, transparent);
  color: color-mix(in srgb, currentColor 70%, transparent);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
#${CANVAS_ID} [data-chatspace-prompt-label],
#${CANVAS_ID} [data-chatspace-response-label] {
  display: block;
  margin-bottom: 3px;
  color: var(--chatspace-muted);
  font-size: 9px;
  font-weight: 650;
  letter-spacing: .06em;
  text-transform: uppercase;
}
#${CANVAS_ID} [data-chatspace-prompt],
#${CANVAS_ID} [data-chatspace-response] {
  min-width: 0;
  overflow: hidden;
  color: color-mix(in srgb, currentColor 88%, transparent);
  font-size: 11.5px;
  line-height: 1.42;
  overflow-wrap: anywhere;
}
#${CANVAS_ID} [data-chatspace-prompt-text],
#${CANVAS_ID} [data-chatspace-response-text] {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
}
#${CANVAS_ID} [data-chatspace-prompt-text] { -webkit-line-clamp: 2; }
#${CANVAS_ID} [data-chatspace-response-text] { -webkit-line-clamp: 4; }
#${CANVAS_ID} [data-chatspace-card-actions] { display: flex; gap: 6px; min-height: 20px; opacity: .72; }
#${CANVAS_ID} [data-chatspace-card-action],
#${CANVAS_ID} [data-chatspace-toolbar-button] {
  appearance: none;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
#${CANVAS_ID} [data-chatspace-card-action] { padding: 3px 7px; border-radius: var(--chatspace-radius-sm); font-size: 10px; }
#${CANVAS_ID} [data-chatspace-card-action]:hover,
#${CANVAS_ID} [data-chatspace-toolbar-button]:hover { background: color-mix(in srgb, currentColor 7%, transparent); }
#${CANVAS_ID} button:focus-visible,
#${CANVAS_ID} input:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--chatspace-accent) 72%, transparent);
  outline-offset: 2px;
}

/* Semantic zoom reduces information, never the node geometry used by layout/edges/minimap. */
#${CANVAS_ID}[data-chatspace-zoom-level="mid"] [data-chatspace-card-actions] { visibility: hidden; }
#${CANVAS_ID}[data-chatspace-zoom-level="far"] [data-chatspace-prompt],
#${CANVAS_ID}[data-chatspace-zoom-level="far"] [data-chatspace-response],
#${CANVAS_ID}[data-chatspace-zoom-level="far"] [data-chatspace-card-actions] { visibility: hidden; }
#${CANVAS_ID}[data-chatspace-zoom-level="far"] [${NODE_ATTRIBUTE}] { grid-template-rows: auto 1fr 1fr auto; }

#${CANVAS_ID} [data-chatspace-toolbar] {
  position: absolute;
  top: 14px;
  left: 50%;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: var(--chatspace-space-2);
  max-width: calc(100% - 32px);
  transform: translateX(-50%);
}
#${CANVAS_ID} [data-chatspace-toolbar-group] {
  display: flex;
  align-items: center;
  gap: var(--chatspace-space-1);
  min-height: 38px;
  padding: var(--chatspace-space-1);
  border: 1px solid var(--chatspace-border);
  border-radius: var(--chatspace-radius-md);
  background: var(--chatspace-panel);
  box-shadow: var(--chatspace-shadow-float);
}
#${CANVAS_ID} [data-chatspace-search] {
  width: clamp(150px, 24vw, 310px);
  height: var(--chatspace-control-height);
  padding: 0 9px;
  border: 0;
  outline: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 12px;
}
#${CANVAS_ID} [data-chatspace-search-count] {
  min-width: 0;
  padding-right: 6px;
  color: var(--chatspace-muted);
  font-size: 10px;
  white-space: nowrap;
}
#${CANVAS_ID} [data-chatspace-toolbar-button] { min-width: 30px; height: var(--chatspace-control-height); padding: 0 9px; border-radius: var(--chatspace-radius-sm); font-size: 11px; }
#${CANVAS_ID} [data-chatspace-zoom-readout] { min-width: 46px; text-align: center; font-size: 11px; font-variant-numeric: tabular-nums; }

#${CANVAS_ID} [data-chatspace-inspector] {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 26;
  width: min(390px, 36vw);
  min-width: 330px;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  border-left: 1px solid var(--chatspace-border);
  background: var(--chatspace-panel);
  box-shadow: -14px 0 40px rgb(0 0 0 / .04);
  transform: translateX(102%);
  transition: transform 220ms var(--chatspace-ease);
}
#${CANVAS_ID} [data-chatspace-inspector][data-chatspace-open="true"] { transform: translateX(0); }
#${CANVAS_ID} [data-chatspace-inspector-header] { display: flex; gap: 10px; padding: 20px 20px 14px; border-bottom: 1px solid var(--chatspace-border); }
#${CANVAS_ID} [data-chatspace-inspector-title] { margin-right: auto; }
#${CANVAS_ID} [data-chatspace-inspector-title] strong { display: block; font-size: 16px; }
#${CANVAS_ID} [data-chatspace-inspector-title] span { display: block; margin-top: 4px; color: var(--chatspace-muted); font-size: 11px; }
#${CANVAS_ID} [data-chatspace-inspector-close] { width: 30px; height: 30px; border: 0; border-radius: var(--chatspace-radius-sm); background: transparent; color: inherit; font-size: 18px; cursor: pointer; }
#${CANVAS_ID} [data-chatspace-inspector-body] { min-height: 0; overflow: auto; overscroll-behavior: contain; scrollbar-gutter: stable; padding: 18px 20px 36px; user-select: text; }
#${CANVAS_ID} [data-chatspace-inspector-section] + [data-chatspace-inspector-section] { margin-top: 24px; }
#${CANVAS_ID} [data-chatspace-inspector-label] { margin-bottom: 8px; color: var(--chatspace-muted); font-size: 10px; font-weight: 650; letter-spacing: .06em; text-transform: uppercase; }
#${CANVAS_ID} [data-chatspace-inspector-content] { font-size: 13px; line-height: 1.58; overflow-wrap: anywhere; }
#${CANVAS_ID} [data-chatspace-inspector-content] pre { max-width: 100%; overflow: auto; border-radius: 10px; }
#${CANVAS_ID} [data-chatspace-inspector-content] img { max-width: 100%; height: auto; }
#${CANVAS_ID} [data-chatspace-inspector-actions] { display: flex; gap: var(--chatspace-space-2); padding: 14px 20px 20px; border-top: 1px solid var(--chatspace-border); }
#${CANVAS_ID} [data-chatspace-primary-action],
#${CANVAS_ID} [data-chatspace-secondary-action] { min-height: 34px; padding: 0 13px; border-radius: 9px; font: inherit; font-size: 11px; cursor: pointer; }
#${CANVAS_ID} [data-chatspace-primary-action] { border: 1px solid var(--chatspace-accent); background: var(--chatspace-accent); color: white; }
#${CANVAS_ID} [data-chatspace-secondary-action] { border: 1px solid var(--chatspace-border); background: transparent; color: inherit; }

#${CANVAS_ID} [data-chatspace-minimap] {
  position: absolute;
  left: var(--chatspace-space-4);
  bottom: var(--chatspace-space-4);
  z-index: 22;
  width: 188px;
  height: 112px;
  overflow: hidden;
  border: 1px solid var(--chatspace-border);
  border-radius: var(--chatspace-radius-md);
  background: var(--chatspace-panel);
  box-shadow: var(--chatspace-shadow-float);
  pointer-events: none;
}
#${CANVAS_ID} [data-chatspace-minimap-node] { position: absolute; min-width: 8px; min-height: 5px; border-radius: 2px; background: color-mix(in srgb, currentColor 26%, transparent); }
#${CANVAS_ID} [data-chatspace-minimap-node][data-chatspace-active="true"] { background: color-mix(in srgb, var(--chatspace-accent) 78%, transparent); }
#${CANVAS_ID} [data-chatspace-minimap-node][data-chatspace-selected="true"] { box-shadow: 0 0 0 1px var(--chatspace-accent); }
#${CANVAS_ID} [data-chatspace-minimap-viewport] { position: absolute; border: 1px solid color-mix(in srgb, var(--chatspace-accent) 72%, transparent); border-radius: 3px; background: color-mix(in srgb, var(--chatspace-accent) 7%, transparent); }

#${CANVAS_ID} [data-chatspace-composer-dock] {
  position: absolute;
  left: 50%;
  bottom: 18px;
  z-index: 24;
  width: min(680px, calc(100% - 460px));
  min-width: 360px;
  transform: translateX(-50%);
}
#${CANVAS_ID} [data-chatspace-composer-button] {
  width: 100%;
  min-height: 54px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid var(--chatspace-border);
  border-radius: var(--chatspace-radius-lg);
  background: var(--chatspace-panel);
  box-shadow: 0 10px 34px rgb(0 0 0 / .08);
  color: inherit;
  text-align: left;
  cursor: pointer;
}
#${CANVAS_ID} [data-chatspace-composer-button]:disabled { cursor: default; opacity: .55; }
#${CANVAS_ID} [data-chatspace-composer-icon] { width: 30px; height: 30px; display: grid; place-items: center; flex: 0 0 auto; border-radius: 999px; background: var(--chatspace-accent-soft); color: var(--chatspace-accent); }
#${CANVAS_ID} [data-chatspace-composer-copy] strong { display: block; font-size: 12px; }
#${CANVAS_ID} [data-chatspace-composer-copy] span { display: block; margin-top: 3px; color: var(--chatspace-muted); font-size: 10px; }

@keyframes chatspace-node-enter {
  from { opacity: 0; transform: translateY(4px) scale(.995); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes chatspace-pulse {
  0%, 100% { opacity: .45; transform: scale(.92); }
  50% { opacity: 1; transform: scale(1); }
}
@media (max-width: 980px) {
  #${CANVAS_ID} [data-chatspace-inspector] { width: min(360px, 88vw); min-width: 0; }
  #${CANVAS_ID} [data-chatspace-search] { width: clamp(120px, 30vw, 220px); }
  #${CANVAS_ID} [data-chatspace-search-count] { display: none; }
  #${CANVAS_ID} [data-chatspace-composer-dock] { width: min(620px, calc(100% - 40px)); min-width: 0; }
}
@media (max-width: 720px) {
  #${CANVAS_ID} [data-chatspace-toolbar] { left: 12px; right: 12px; transform: none; justify-content: center; }
  #${CANVAS_ID} [data-chatspace-toolbar-group]:first-child { flex: 1; }
  #${CANVAS_ID} [data-chatspace-search] { width: 100%; min-width: 0; }
  #${CANVAS_ID} [data-chatspace-toolbar-group]:nth-child(2) { display: none; }
  #${CANVAS_ID} [data-chatspace-minimap] { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  #${CANVAS_ID} [${NODE_ATTRIBUTE}],
  #${CANVAS_ID} [data-chatspace-inspector] { animation: none; transition: none; }
}
`;