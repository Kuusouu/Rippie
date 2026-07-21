import type { ChatInputCommandInteraction } from 'discord.js';

export type ServiceConfig = {
	emoji: string;
};

export type BotConfig = {
	services?: Record<string, ServiceConfig>;
};

export type GuildSettings = {
	musicChannelId?: string;
	services?: Record<string, boolean>;
	settingsRoleIds?: string[];
};

export type SettingsStore = Record<string, GuildSettings>;

// Normalized track information shared across all platform integrations.
export type TrackInfo = {
	name: string;
	artists: string[];
	isrc: string | null;
	link: string | null;
};

export interface Command {
	data: unknown;
	execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
