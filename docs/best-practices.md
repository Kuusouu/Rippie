# Rippie TypeScript Best Practices

This document outlines the coding standards for Rippie. Keep it simple, strictly typed, and consistent.

## 1. Types & Interfaces

- **Primitives:** Always use lowercase `string`, `number`, `boolean`. Never use uppercase (`String`, `Number`).
- **Interfaces vs. Types:** Prefer `type` for aliases and unions. Use `interface` primarily for class shapes or module augmentation (e.g., in `client.d.ts`).
- **The `any` rule:** Do NOT use `any`. Use `unknown` if the type is truly unknown, then narrow it down with type guards (or use Zod schemas, as seen in `env.ts`).
- **Callbacks:** If a callback's return value is ignored, type its return as `void`, not `any`.

## 2. Variables & Functions

- **Const by default:** Always use `const`. Only use `let` if the variable absolutely must be reassigned (e.g., caching a token in `spotify.ts`). Never use `var`.
- **Functions:** Use arrow functions (`const myFunc = () => {}`) for everything except class methods.
- **Nullability:** Prefer Optional Chaining (`obj?.prop`) and Nullish Coalescing (`value ?? fallback`).

## 3. Naming Conventions

- `camelCase` for variables, functions, and files (`appleMusic.ts`, `deploy-commands.js`).
- `PascalCase` for Types, Interfaces, and Zod Schemas (`TrackInfo`, `BotConfig`).
- `UPPER_SNAKE_CASE` for global constants, environment variables, and regex patterns (`TRACK_ID_PATTERN`).

## 4. Architecture & Clean Code

- **Async/Await:** Always use `async/await`. Avoid `.then().catch()` chains. Handle errors gracefully.
- **Encapsulation:** Do not export types or helper functions unless they are actively used outside the file. Keep the public API surface small.
- **Comments:** Comment the _why_, not the _what_ (see `config.ts` for a great example of explaining _why_ synchronous writes are used).
