import { Client } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { BotConfig, SettingsStore } from './types';

const configPath = path.join(__dirname, '../config.json');
const settingsPath = path.join(__dirname, '../settings.json');

export const loadBotConfig = (): BotConfig => {
	if (!fs.existsSync(configPath)) {
		return {};
	}

	try {
		return JSON.parse(fs.readFileSync(configPath, 'utf8')) as BotConfig;
	} catch (error) {
		console.error(
			'Failed to load config.json, continuing without services.',
			error,
		);
		return {};
	}
};

export const loadSettings = (): SettingsStore => {
	if (!fs.existsSync(settingsPath)) {
		return {};
	}

	try {
		return JSON.parse(
			fs.readFileSync(settingsPath, 'utf8'),
		) as SettingsStore;
	} catch (error) {
		console.error(
			'Failed to load settings.json, starting with an empty store.',
			error,
		);
		return {};
	}
};

// Intentionally synchronous. This blocks the event loop for the duration of
// the write, but that's a feature here, not a bug: it guarantees saves can
// never overlap or interleave with each other, even if multiple servers
// trigger a setting change in quick succession. No queueing/coalescing
// logic needed.
//
// This is fine as long as settings.json stays small and saves stay
// infrequent (the expected case for a self-hosted bot in a handful of
// servers). If this bot is ever run at much larger scale with frequent
// saves and/or a large settings file, the blocking write may become a
// noticeable bottleneck. At that point, we could consider moving to a real
// database (e.g. SQLite) rather than reaching for an async queued-write
// pattern on top of a single JSON file, since the file-based approach
// itself becomes the limiting factor before write-concurrency does.
export const saveSettings = (client: Client): void => {
	fs.writeFileSync(
		settingsPath,
		`${JSON.stringify(client.settings, null, 2)}\n`,
	);
};

export const getServiceEntries = (config: BotConfig) => {
	return Object.entries(config.services ?? {}).map(([name, service]) => ({
		name,
		emoji: service.emoji,
	}));
};
