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
