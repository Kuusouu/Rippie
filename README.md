# 🎵 Rippie

> Drop a stone in water, and it ripples outward in every direction. Rippie does the same for music.

Share a song from any platform: Spotify, Apple Music, YouTube Music, etc. and Rippie catches it, then sends it back out across every platform you care about. All in your Discord server.

No more "I don't have Spotify." No more re-searching the same song. One link becomes many.

## What it does

When a music link is posted in a channel Rippie is watching, it responds with the original link alongside buttons for every equivalent platform. Everyone in the server can open the song in whatever service they actually use.

Platform buttons are configurable per server, so you only see the ones that matter to your community.

## Planned features

- [ ] Detect music links from major platforms automatically
- [ ] Resolve cross-platform equivalents by communicating directly with each platform's API
- [ ] Reply with platform buttons (Spotify, YouTube Music, Apple Music, SoundCloud, Tidal, and more)
- [x] Per-server configuration for which platforms to show
- [x] Per-server configuration for which channel Rippie listens in, because scanning an entire server would be exhausting on resources and noisy for everyone!
- [x] Per-server configuration for which roles can manage settings

## A note on the journey

Rippie started as a Python project. Along the way I decided to challenge myself and rebuild it in TypeScript, a language I'm learning from scratch. It's been a way to get real reps with JS/TS while building something I actually want to use.

## Status

🚧 Early development and testing

Currently researching the mainstream platform APIs to understand how to fetch and match tracks across services, replacing the original plan to use the Odesli API, which is being deprecated.

## Built with

- [discord.js](https://discord.js.org/)
- [TypeScript](https://www.typescriptlang.org/)

## Contributing

Not ready for contributions yet, but feel free to open issues with ideas or feedback.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
