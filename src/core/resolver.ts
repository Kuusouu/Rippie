import { lookupDeezerTrackByIsrc } from './deezer';
import { Platform } from './music';
import { lookupSpotifyTrackByIsrc } from './spotify';

// A map of Platform -> canonical URL for a given track.
export type ResolvedLinks = Map<Platform, string>;

// Resolves an ISRC to platform links for each platform that has a lookup
// implementation. Lookups run in parallel. Failed/unresolved platforms are
// silently omitted from the result map.
export const resolveLinksFromIsrc = async (
	isrc: string,
	platforms: Platform[],
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
