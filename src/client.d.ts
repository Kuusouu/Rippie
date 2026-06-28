import { Collection } from 'discord.js';

// Module augmentation, commands are available within the Discord Client class without a explicit cast or
// separate class
declare module 'discord.js' {
	interface GuildSettings {
		musicChannelId?: string;
		services?: Record<string, boolean>;
	}

	interface Client<Ready extends boolean = boolean> {
		commands: Collection<string, any>;
		settings: Record<string, GuildSettings>;
	}
}
