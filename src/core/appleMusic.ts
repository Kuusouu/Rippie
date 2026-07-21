/**
 * Apple Music / iTunes Core Module
 *
 * NOTE: The official Apple Music API is behind a paywall. While the free iTunes
 * Search API exists, it can sometimes miss information or be unreliable for direct
 * lookups. To work around this, we use a hybrid approach: we scrape the public Apple
 * Music search page to find candidate links, and then validate those candidates
 * against the iTunes Lookup API to ensure accuracy and retrieve high-quality metadata.
 */

import { distance } from 'fastest-levenshtein';
import type { TrackInfo } from '../types';
import { normalizeText, pickBestDeezerTrack } from './utils';

// Types

interface ITunesResult {
	trackId: number;
	artistName: string;
	collectionName: string;
	trackName?: string;
}

interface ITunesLookupResponse {
	results: ITunesResult[];
}

// Extracts a numeric iTunes/Apple Music track or album ID from a URL.
// Prefers the ?i= track parameter over the album ID in the path.
const extractAppleId = (url: string): string | null => {
	const trackMatch = url.match(/[?&]i=(\d+)/);
	if (trackMatch) return trackMatch[1] ?? null;

	// Fallback to the album ID at the end of the URL path
	const albumMatch = url.match(/\/(\d+)(?:\?|$)/);
	return albumMatch ? (albumMatch[1] ?? null) : null;
};

// Batch-fetches iTunes records.
const fetchITunesRecords = async (ids: string): Promise<ITunesResult[]> => {
	const res = await fetch(`https://itunes.apple.com/lookup?id=${ids}`);
	const json = (await res.json()) as ITunesLookupResponse;
	return json.results ?? [];
};

// Exports

// Scrapes the Apple Music public search page for a track, validating candidates against the iTunes API via Levenshtein scoring.
export const lookupAppleTrackByInfo = async (
	artist: string,
	song: string,
): Promise<string | null> => {
	const searchQuery = `${artist} ${song}`;
	const searchUrl = `https://music.apple.com/us/search?term=${encodeURIComponent(searchQuery)}`;
	const targetSignature = normalizeText(`${artist} - ${song}`);

	const response = await fetch(searchUrl, {
		headers: {
			'User-Agent':
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
		},
	});

	const html = await response.text();
	const songBlockRegex =
		/"contentDescriptor":\s*\{\s*"kind"\s*:\s*"song"[\s\S]*?"url"\s*:\s*"(https:\/\/music\.apple\.com\/us\/album\/[^"\\?]+[^"]+\?i=\d+)"/g;
	const songMatches = [...html.matchAll(songBlockRegex)];

	if (songMatches.length === 0) return null;

	const cleanUrls = songMatches.map((m) => (m[1] ?? '').replace(/\\\//g, '/'));
	const topTrackUrls = [...new Set(cleanUrls)].slice(0, 5);

	const trackItems = topTrackUrls
		.map((link) => ({ link, trackId: extractAppleId(link) }))
		.filter((item) => item.trackId !== null);

	const trackIds = trackItems.map((item) => item.trackId).join(',');
	const itunesResults = trackIds ? await fetchITunesRecords(trackIds) : [];

	let bestLink: string | null = null;
	let lowestMatchScore = Infinity;

	for (const { link, trackId } of trackItems) {
		const data = itunesResults.find((r) => r.trackId.toString() === trackId);
		if (!data) continue;

		const rawItunesSignature = `${data.artistName} - ${data.collectionName}`;
		const itunesScore = distance(targetSignature, normalizeText(rawItunesSignature));

		let urlScore = 0;
		const slugMatch = link.match(/\/album\/([^/]+)\/\d+/);
		if (slugMatch) {
			urlScore = distance(normalizeText(song), normalizeText(slugMatch[1] ?? ''));
		}

		const matchScore = itunesScore + urlScore;
		if (matchScore < lowestMatchScore) {
			lowestMatchScore = matchScore;
			bestLink = link;
		}
	}

	return bestLink;
};

// Bridges Apple Music to a universal Deezer track (with ISRC) via the iTunes Lookup API and fuzzy matching.
export const lookupAppleTrackByLink = async (url: string): Promise<TrackInfo | null> => {
	const appleId = extractAppleId(url);
	if (!appleId) return null;

	const results = await fetchITunesRecords(appleId);
	if (results.length === 0) return null;

	const record = results[0];
	if (!record) return null;
	const artistName: string = record.artistName;
	// Fallback to collectionName if trackName isn't present (album-level links)
	const trackName: string = record.trackName || record.collectionName;

	const targetSignature = normalizeText(`${artistName} - ${trackName}`);
	return pickBestDeezerTrack(targetSignature);
};
