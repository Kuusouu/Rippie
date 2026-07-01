import { Client, Events } from 'discord.js';
import { detectMusicPlatform, Platform } from '../core/music';
import { extractSpotifyTrackId, fetchSpotifyTrackInfo } from '../core/spotify';
import { extractDeezerTrackId, fetchDeezerTrackInfo } from '../core/deezer';
import type { TrackInfo } from '../core/spotify';

// Resolves a detected platform link to a TrackInfo object.
// Returns null if the track ID cannot be extracted or the platform isn't handled yet.
const resolveTrackInfo = async (
	platform: Platform,
	content: string,
): Promise<TrackInfo | null> => {
	if (platform === Platform.Spotify) {
		const trackId = extractSpotifyTrackId(content);
		if (!trackId) return null;
		return fetchSpotifyTrackInfo(trackId);
	}

	if (platform === Platform.Deezer) {
		const trackId = await extractDeezerTrackId(content);
		if (!trackId) return null;
		return fetchDeezerTrackInfo(trackId);
	}

	return null;
};

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

		try {
			const track = await resolveTrackInfo(platform, message.content);
			if (!track) {
				await message.reply(
					`${platform} link detected, but could not resolve track info.`,
				);
				return;
			}

			const artists = track.artists.join(', ');
			const isrc = track.isrc ?? 'N/A';
			await message.reply(
				`**${track.name}** — ${artists}\nISRC: \`${isrc}\``,
			);
		} catch (error) {
			console.error(`Failed to fetch ${platform} track info:`, error);
			await message.reply(
				`${platform} link detected, but failed to fetch track info.`,
			);
		}
	});
};
