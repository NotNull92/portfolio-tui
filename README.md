# Portfolio-TUI

Fallout Pip-Boy / terminal UI style portfolio built with React, Vite, Framer Motion, Lucide React, and custom CSS.

## Interaction Gimmick

The boot/authentication sequence is a presentation gimmick, not a security boundary. Anyone can enter: pressing Enter on an empty input lets you straight in, and the terminal is skipped entirely on a return visit or via a `?direct` link.

`ACCESS_KEY` (`alena`) still works if typed, but it is no longer printed on screen — the on-screen hint was removed because the prompt reads better without it. **This does not make it a gate.** The value sits in plain source, there is nothing behind it that Enter alone does not also reach, and it must never be treated as a secret or turned into hidden admin authentication. Admin/editing features were discarded for security reasons; the portfolio should remain a static public presentation surface.

## Scripts

- `npm run dev`: start the Vite dev server
- `npm run build`: build the production bundle
- `npm run lint`: run ESLint
- `npm run preview`: preview the production build

## Media credits

The Hera Agent Godot store thumbnail is reused from [the Hera repository](https://github.com/NotNull92/hera-agent-godot/blob/main/docs/releases/2026-10-19-store-thumbnail.md). Its Godot icon is reproduced from the official icon through image generation: Godot Engine contributors, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The composition connects the terminal to the engine and does not imply endorsement.
