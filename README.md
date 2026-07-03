<div align="center">

# 🎵 Rippie

[![GitHub release](https://img.shields.io/github/v/release/Kuusouu/Rippie?style=for-the-badge&color=7c3aed&label=Latest)](https://github.com/Kuusouu/Rippie/releases)
[![License](https://img.shields.io/github/license/Kuusouu/Rippie?style=for-the-badge&color=10b981)](LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/Kuusouu/Rippie?style=for-the-badge&color=6366f1)](https://github.com/Kuusouu/Rippie/commits)

</div>

> Drop a stone in water, and it ripples outward in every direction. Rippie does the same for music.

Share a song from any platform and Rippie catches it, then sends it back out across every platform you care about. All in your Discord server.

No more "I don't have Spotify." No more re-searching the same song. One link becomes many.

## What it does

When a music link is posted in a channel Rippie is watching, it responds with the original link alongside buttons for every equivalent platform. Everyone in the server can open the song in whatever service they actually use.

Platform buttons are configurable per server, so you only see the ones that matter to your community.

## Platform Support

| Platform      | Status                                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| Spotify       | ![Available](https://img.shields.io/badge/AVAILABLE-2ea043?style=flat-square&logo=spotify&logoColor=white)      |
| Apple Music   | ![Available](https://img.shields.io/badge/AVAILABLE-2ea043?style=flat-square&logo=applemusic&logoColor=white)   |
| Deezer        | ![Available](https://img.shields.io/badge/AVAILABLE-2ea043?style=flat-square&logo=deezer&logoColor=white)       |
| YouTube Music | ![Available](https://img.shields.io/badge/AVAILABLE-2ea043?style=flat-square&logo=youtubemusic&logoColor=white) |
| Tidal         | ![Researching](https://img.shields.io/badge/RESEARCHING-bf8700?style=flat-square&logo=tidal&logoColor=white)    |
| Amazon Music  | ![Not Available](https://img.shields.io/badge/NOT_AVAILABLE-6e7681?style=flat-square)                           |
| Qobuz         | ![Not Available](https://img.shields.io/badge/NOT_AVAILABLE-6e7681?style=flat-square)                           |

> Deezer is used as Rippie's internal metadata backbone for cross-platform resolution, regardless of whether it is enabled in a server.

## Features

- [x] Detect music links from major platforms automatically
- [x] Resolve cross-platform equivalents via platform APIs and ISRC matching
- [x] Reply with platform buttons for every equivalent platform
- [x] Per-server configuration for which platforms to show
- [x] Per-server configuration for which channel Rippie listens in
- [x] Per-server configuration for which roles can manage settings

## A note on the journey

Rippie started as a Python project. Along the way I decided to challenge myself and rebuild it in TypeScript, a language I'm learning from scratch. It's been a way to get real reps with JS/TS while building something I actually want to use.

## Status

🌊 Active development — core cross-platform resolution is working. More platforms and polish coming soon.

## Built with

- [discord.js](https://discord.js.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Bun](https://bun.sh/)

## Contributing

Not ready for contributions yet, but feel free to open issues with ideas or feedback.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
