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
