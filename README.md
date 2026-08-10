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
