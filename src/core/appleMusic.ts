import { distance } from 'fastest-levenshtein';
import { TrackInfo } from '../types';

// --- Types ---

interface ITunesResult {
	trackId: number;
	artistName: string;
	collectionName: string;
}

interface ITunesLookupResponse {
	results: ITunesResult[];
}

// --- Shared Utilities ---

// Normalizes a string for fuzzy comparison by stripping punctuation, noise
// words, feature credits, and URL slug separators.
export const normalizeText = (text: string): string => {
	if (!text) return '';
	let cleaned = text.toLowerCase();

	// Convert URL/slug separators to spaces
	cleaned = cleaned.replace(/[-_]/g, ' ');

	// Strip punctuation elements
	cleaned = cleaned.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\[\]™]/g, '');

	// Truncate anything trailing feature artist credits
	cleaned = cleaned.replace(/\b(feat|ft|featuring)\b[\s\S]*/g, '');

	// Clean standalone noise words
	const noiseWords = [
		'official',
		'remastered',
		'remaster',
		'explicit',
		'audio',
		'video',
		'single',
		'album',
		'version',
	];
	noiseWords.forEach((word) => {
		const regex = new RegExp(`\\b${word}\\b`, 'g');
		cleaned = cleaned.replace(regex, '');
	});

	return cleaned.replace(/\s+/g, ' ').trim();
};

// Extracts a numeric iTunes/Apple Music track or album ID from a URL.
// Prefers the ?i= track parameter over the album ID in the path.
const extractAppleId = (url: string): string | null => {
	// Prefer ?i= for a specific track
	const trackMatch = url.match(/[?&]i=(\d+)/);
	if (trackMatch) return trackMatch[1];

	// Fallback to the album ID at the end of the URL path
	const albumMatch = url.match(/\/(\d+)(?:\?|$)/);
	return albumMatch ? albumMatch[1] : null;
};

// Fetches one or more iTunes records by ID (comma-separated for batch).
const fetchITunesRecords = async (ids: string): Promise<ITunesResult[]> => {
	const res = await fetch(`https://itunes.apple.com/lookup?id=${ids}`);
	const json = (await res.json()) as ITunesLookupResponse;
	return json.results ?? [];
};

// Picks the best Deezer result for a given target signature using Levenshtein distance.
const pickBestDeezerTrack = async (
	targetSignature: string,
): Promise<TrackInfo | null> => {
	const deezerUrl = `https://api.deezer.com/search?q=${encodeURIComponent(targetSignature)}`;
	const res = await fetch(deezerUrl);
	const json = await res.json();

	if (!json.data || !Array.isArray(json.data) || json.data.length === 0) {
		return null;
	}

	let bestTrack: any = null;
	let lowestScore = Infinity;

	for (const track of json.data) {
		const deezerSignature = normalizeText(
			`${track.artist.name} - ${track.title}`,
		);
		const score = distance(targetSignature, deezerSignature);
		if (score < lowestScore) {
			lowestScore = score;
			bestTrack = track;
		}
	}

	if (!bestTrack) return null;

	return {
		name: bestTrack.title,
		artists: [bestTrack.artist.name],
		isrc: bestTrack.isrc ?? null,
		link: bestTrack.link ?? null,
	};
};

// --- Exports ---

// Searches the Apple Music public search page by artist + song name, then
// validates candidates against the iTunes Lookup API using Levenshtein scoring.
// Returns the best-matching Apple Music track URL, or null if none found.
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

	const cleanUrls = songMatches.map((m) => m[1].replace(/\\\//g, '/'));
	const topTrackUrls = [...new Set(cleanUrls)].slice(0, 5);

	const trackItems = topTrackUrls
		.map((link) => ({ link, trackId: extractAppleId(link) }))
		.filter((item) => item.trackId !== null);

	const trackIds = trackItems.map((item) => item.trackId).join(',');
	const itunesResults = trackIds ? await fetchITunesRecords(trackIds) : [];

	let bestLink: string | null = null;
	let lowestMatchScore = Infinity;

	for (const { link, trackId } of trackItems) {
		const data = itunesResults.find(
			(r) => r.trackId.toString() === trackId,
		);
		if (!data) continue;

		const rawItunesSignature = `${data.artistName} - ${data.collectionName}`;
		const itunesScore = distance(
			targetSignature,
			normalizeText(rawItunesSignature),
		);

		let urlScore = 0;
		const slugMatch = link.match(/\/album\/([^\/]+)\/\d+/);
		if (slugMatch) {
			urlScore = distance(
				normalizeText(song),
				normalizeText(slugMatch[1]),
			);
		}

		const matchScore = itunesScore + urlScore;
		if (matchScore < lowestMatchScore) {
			lowestMatchScore = matchScore;
			bestLink = link;
		}
	}

	return bestLink;
};

// Resolves an Apple Music link to a Deezer track (ISRC + link) by:
//   1. Extracting the iTunes ID from the URL (track ?i= or album path fallback)
//   2. Fetching metadata from the iTunes Lookup API
//   3. Running a fuzzy Deezer search scored by Levenshtein distance
// Returns null if any step fails to produce a confident match.
export const lookupAppleTrackByLink = async (
	url: string,
): Promise<TrackInfo | null> => {
	const appleId = extractAppleId(url);
	if (!appleId) return null;

	const results = await fetchITunesRecords(appleId);
	if (results.length === 0) return null;

	const record = results[0];
	const artistName: string = record.artistName;
	// Fallback to collectionName if trackName isn't present (album-level links)
	const trackName: string =
		(record as any).trackName || record.collectionName;

	const targetSignature = normalizeText(`${artistName} - ${trackName}`);
	return pickBestDeezerTrack(targetSignature);
};
