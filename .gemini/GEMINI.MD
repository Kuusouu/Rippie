# Rippie - Agent Guidelines

You are assisting with the development of Rippie, a Discord bot built with TypeScript, Discord.js, and Bun.

## Repository Structure

- `src/` (Root): Core bot initialization (`main.ts`), environment validation (`env.ts`), global types (`types.ts`), and configuration/permissions logic.
- `src/core/`: External API integrations (Spotify, Apple Music, Deezer, YouTube) and cross-platform resolution logic.
- `src/commands/`: Discord slash commands (e.g., `/about`, `/settings`).
- `src/events/`: Discord event listeners (e.g., `messageCreate`, `interactionCreate`).
- `src/experiments/`: Isolated scripts for manually testing platform API lookups (e.g., testing Deezer ISRC lookups without running the full bot).

## Core Rules & Workflow

1. **Writing Code?** You MUST read and follow the rules in `.gemini/best-practices.md` before generating or modifying TypeScript code.
2. **Review Before Committing:** After making changes, you MUST show the user a summary of every file changed and a diff-style overview. Tell the user exactly what happened so they can review it before considering the task complete.
3. **Discord API?** Reference the official [Discord.js documentation](https://discord.js.org/docs/packages/discord.js/14.26.4).
4. **Adding Dependencies?** Rippie uses `bun`. Do not add new `npm` packages without explicit user permission. Prioritize native standard library solutions where possible.
5. **Writing Commits?** Keep commit messages concise. You can explain changes, but do NOT generate a wall of text. You MUST follow the [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) specification.
