import type { TrackInfo } from '../types';
import { lookupAppleTrackByInfo } from './appleMusic';
import { lookupDeezerTrackByIsrc } from './deezer';
import { Platform } from './music';
import { lookupSpotifyTrackByIsrc } from './spotify';

// A map of Platform -> canonical URL for a given track.
export type ResolvedLinks = Map<Platform, string>;

// Resolves an ISRC to platform links for each platform that has a lookup
// implementation. Lookups run in parallel. Failed/unresolved platforms are
// silently omitted from the result map.
//
// TrackInfo is passed in alongside the ISRC so platforms like Apple Music
// (which resolve via a scraper rather than an ISRC API) can use the already-
// normalized artist + track name without making an extra API call.
export const resolveLinksFromIsrc = async (
	isrc: string,
	platforms: Platform[],
	track: TrackInfo,
): Promise<ResolvedLinks> => {
	const resolvers: Partial<Record<Platform, () => Promise<string | null>>> = {
		[Platform.Spotify]: async () => {
			const result = await lookupSpotifyTrackByIsrc(isrc);
			return result?.link ?? null;
		},
		[Platform.Deezer]: async () => {
			const result = await lookupDeezerTrackByIsrc(isrc);
			return result.link;
		},
		[Platform.AppleMusic]: async () => {
			const artist = track.artists[0];
			const song = track.name;
			if (!artist || !song) return null;
			return lookupAppleTrackByInfo(artist, song);
		},
	};

	const entries = await Promise.allSettled(
		platforms
			.filter((p) => resolvers[p])
			.map(async (p): Promise<[Platform, string] | null> => {
				const link = await resolvers[p]!();
				return link ? [p, link] : null;
			}),
	);

	const resolved: ResolvedLinks = new Map();
	for (const result of entries) {
		if (result.status === 'fulfilled' && result.value) {
			const [platform, link] = result.value;
			resolved.set(platform, link);
		}
	}

	return resolved;
};
