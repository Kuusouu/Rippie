# Contributing to Rippie

First off, thank you for considering contributing to Rippie! It's people like you that make open source tools better for everyone.

## How can you contribute?

### 🐛 Bug Reports

If you find a bug, please create an issue using the **Bug Report** template. Make sure to include:

- A clear description of the problem.
- Steps to reproduce the issue.
- Your environment details (OS, Bun version).

### ✨ Feature Requests

Have an idea for a new feature or music platform integration? Great! Open an issue using the **Feature Request** template. Describe the feature, why it's needed, and if applicable, link to the relevant API documentation.

### 💻 Code Contributions

1. **Fork the repo** and clone it locally.
2. **Install dependencies** using `bun install`.
3. **Read our Best Practices**: All code (whether written by humans or AI agents) must follow the standards outlined in `.gemini/best-practices.md`.
4. **Create a branch** for your feature or bug fix (`git checkout -b feature/my-new-platform`).
5. **Write your code** and make sure things are strictly typed. Avoid `any`.
6. **Format and lint**: Run `bun run format` and `bun run format-check` before committing.
7. **Test manually**: Rippie interacts with multiple external APIs (Spotify, Apple Music, etc.). Ensure you have manually tested your changes against real links in a Discord server or the experiments (these are thin CLI wrappers for the core functionality).
8. **Commit your changes**: Keep commit messages concise. Explanations are fine, but avoid writing a wall of text. You MUST follow the [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) specification (e.g., `feat: added Spotify support`).

## Pull Requests

### AI-Assisted Contributions

AI tools (e.g., Copilot, Claude, ChatGPT, etc.) may be used to assist with contributions, but **you** are fully responsible for every PR you submit.

- You must understand the changes you are proposing.
- All changes must be manually built, tested, and verified by you before submitting a PR.
- Be transparent about AI involvement if it played a significant role.

### The PR Process

1. Push your changes to your fork.
2. Open a Pull Request against the `master` branch.
3. Fill out the **Pull Request Template** completely. Include evidence of your manual testing (screenshots of Discord embeds are highly encouraged!).
4. I will review your code. I may ask for changes before merging.

Again, thank you for helping make Rippie better!
