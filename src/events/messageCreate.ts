import { Client, Events } from 'discord.js';
import { detectMusicPlatform } from '../music';

export const registerMessageHandler = (client: Client): void => {
	client.on(Events.MessageCreate, async (message) => {
		if (message.author.bot) return;
		if (!message.guildId) return;

		const guildSettings = client.settings[message.guildId];
		if (!guildSettings?.musicChannelId) return;
		if (message.channelId !== guildSettings.musicChannelId) return;

		const platform = detectMusicPlatform(message.content);
		if (platform) {
			await message.reply(`${platform} link detected.`);
		}
	});
};
