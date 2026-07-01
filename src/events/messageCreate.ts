import { Client, Events } from 'discord.js';
import { detectMusicPlatform, Platform } from '../core/music';
import { extractSpotifyTrackId, fetchSpotifyTrackInfo } from '../core/spotify';

export const registerMessageHandler = (client: Client): void => {
	client.on(Events.MessageCreate, async (message) => {
		// Do not accept messages that come from other bots or outside servers (guilds)
		if (message.author.bot) return;
		if (!message.guildId) return;

		// Only listen in the specific musicChannel for the specific platforms
		const guildSettings = client.settings[message.guildId];
		if (!guildSettings?.musicChannelId || !guildSettings?.services) return;
		if (message.channelId !== guildSettings.musicChannelId) return;

		const platform = detectMusicPlatform(message.content);
		if (!platform) return;

		const guildHasPlatformEnabled = guildSettings.services[platform];
		if (!guildHasPlatformEnabled) return;

		if (platform === Platform.Spotify) {
			const trackId = extractSpotifyTrackId(message.content);
			if (!trackId) {
				await message.reply(
					'Spotify link detected, but could not extract track ID.',
				);
				return;
			}

			try {
				const track = await fetchSpotifyTrackInfo(trackId);
				const artists = track.artists.join(', ');
				const isrc = track.isrc ?? 'N/A';
				await message.reply(
					`**${track.name}** — ${artists}\nISRC: \`${isrc}\``,
				);
			} catch (error) {
				console.error('Failed to fetch Spotify track info:', error);
				await message.reply(
					'Spotify link detected, but failed to fetch track info.',
				);
			}
			return;
		}

		// Fallback for other platforms (to be expanded later)
		await message.reply(`${platform} link detected.`);
	});
};
