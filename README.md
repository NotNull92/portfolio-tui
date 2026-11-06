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

The Hera Agent Unity store thumbnail is reused from [the Hera repository](https://github.com/NotNull92/hera-agent-unity/blob/main/docs/STORE_ASSETS.md). Its Unity mark is reproduced through image generation; Unity and the Unity logo are trademarks of Unity Technologies. The composition connects the terminal to the engine and does not imply endorsement.

## MONSTEL media

The project card and resume use `src/assets/projects/monstel-preview-ko.mp4`, copied from the MONSTEL repository’s `docs/assets/videos/preview/monstel-preview-ko.mp4`: 2026-11-03 Android capture (Galaxy Z Flip7), Korean store preview, 1080×1920 / 60 fps / 54.7 seconds at normal speed. Playback is user-initiated with native controls. The poster is the 2026-11-06 English feature graphic, `assets/branding/feature_en.png`, copied as `src/assets/projects/monstel-feature-en.png`. Both assets and the public development summary were confirmed with the MONSTEL maintainer on 2026-11-06; the video predates the latest effects polish.

## Content verification — 2026-11-06

- [Hera Unity v0.3.25](https://github.com/NotNull92/hera-agent-unity/releases/tag/v0.3.25): Connector 0.3.0, Unity 6.6+ support, opt-in 2022.3 Developer Mode. The local guide is pinned in `public/hera-unity-status/source.json`.
- [Hera Godot v2.1.0](https://github.com/NotNull92/hera-agent-godot/releases/tag/v2.1.0): configured node creation, waiting assertions and narrower reads. The local guide is pinned in `public/hera-godot-status/source.json`; the embedded YouTube demo still shows v2.0.2.
- [WorkForge v0.3.0](https://github.com/NotNull92/workforge-mcp/releases/tag/v0.3.0) and [README](https://github.com/NotNull92/workforge-mcp/blob/35facfff3d12dac68f5abe5255ceee1de99bae18/README.md): 25 default MCP tools and a dashboard in four languages; Windows release / macOS source preview.
- [Hebe v0.0.5](https://github.com/NotNull92/hebe-agent-unity/releases/tag/v0.0.5): the 240 ms warm execution median remains an internal fixed-workload result, not a general latency guarantee.
- [heraAgent README](https://github.com/NotNull92/heraAgent/blob/e32082e932087f4ce6989b53309f123ae4c32af3/README.md): Development / Design modes and public web research; source preview with no published release.
- NoMoreRolls had no newer remote development since the existing portfolio description. Commercial game and career figures were not changed by this GitHub refresh.
