import { Client, Events } from 'discord.js';
import { generatePlatformButtons } from '../buttons';
import { extractDeezerTrackId, fetchDeezerTrackInfo } from '../core/deezer';
import { detectMusicPlatform, Platform } from '../core/music';
import { resolveLinksFromIsrc } from '../core/resolver';
import type { TrackInfo } from '../core/spotify';
import { extractSpotifyTrackId, fetchSpotifyTrackInfo } from '../core/spotify';

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
			// Step 1: Resolve the track info (name, artists, ISRC) from the source link
			const track = await resolveTrackInfo(platform, message.content);
			if (!track) {
				await message.reply(
					`${platform} link detected, but could not resolve track info.`,
				);
				return;
			}

			if (!track.isrc) {
				await message.reply(
					`**${track.name}** — ${track.artists.join(', ')}\n*No ISRC available — cannot resolve links to other platforms.*`,
				);
				return;
			}

			// Step 2: Fan out ISRC lookups to all other enabled platforms in parallel (excluding the source platform)
			const enabledPlatforms = Object.entries(guildSettings.services)
				.filter(([p, enabled]) => enabled && p !== platform)
				.map(([p]) => p as Platform);

			const resolvedLinks = await resolveLinksFromIsrc(
				track.isrc,
				enabledPlatforms,
			);

			// Step 3: Build platform buttons
			const rows = generatePlatformButtons(
				guildSettings.services,
				client.config,
				resolvedLinks,
			);

			const artists = track.artists.join(', ');
			await message.reply({
				content: `**${track.name}** — ${artists}`,
				components: rows,
			});
		} catch (error) {
			console.error(`Failed to fetch ${platform} track info:`, error);
			await message.reply(
				`${platform} link detected, but failed to fetch track info.`,
			);
		}
	});
};
