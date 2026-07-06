# Portfolio-TUI

Fallout Pip-Boy / terminal UI style portfolio built with React, Vite, Framer Motion, Lucide React, and custom CSS.

## Interaction Gimmick

The terminal entry prompt intentionally exposes `ACCESS_KEY: alena` on screen. This is a presentation gimmick for the boot/authentication sequence, not a security boundary.

Do not treat `alena` as a secret, and do not replace it with hidden admin authentication. Admin/editing features were discarded for security reasons; the portfolio should remain a static public presentation surface.

## Scripts

- `npm run dev`: start the Vite dev server
- `npm run build`: build the production bundle
- `npm run lint`: run ESLint
- `npm run preview`: preview the production build
