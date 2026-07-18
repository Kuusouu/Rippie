import { Collection } from 'discord.js';
import { BotConfig, Command, SettingsStore } from './types';

// Module augmentation, commands are available within the Discord Client class without a explicit cast or
// separate class
declare module 'discord.js' {
	interface Client {
		commands: Collection<string, Command>;
		settings: SettingsStore;
		config: BotConfig;
	}
}
