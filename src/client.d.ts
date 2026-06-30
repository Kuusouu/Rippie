import { Collection } from 'discord.js';
import { BotConfig, SettingsStore } from './types';

// Module augmentation, commands are available within the Discord Client class without a explicit cast or
// separate class
declare module 'discord.js' {
	interface Client<Ready extends boolean = boolean> {
		commands: Collection<string, any>;
		settings: SettingsStore;
		config: BotConfig;
	}
}
