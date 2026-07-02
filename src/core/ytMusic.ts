import { distance } from 'fastest-levenshtein';
import YTMusic from 'ytmusic-api';
import type { TrackInfo } from '../types';
import { normalizeText, pickBestDeezerTrack } from './utils';

// Singleton instance of YTMusic
let ytmusicInstance: YTMusic | null = null;

const getYTMusic = async (): Promise<YTMusic> => {
	if (!ytmusicInstance) {
		ytmusicInstance = new YTMusic();
		await ytmusicInstance.initialize();
	}
	return ytmusicInstance;
};

// Extracts a YouTube video ID from a standard URL or short link
export const extractYtMusicId = (url: string): string | null => {
	try {
		const urlObj = new URL(url);
		if (urlObj.searchParams.has('v')) {
			return urlObj.searchParams.get('v');
		}
		if (urlObj.hostname === 'youtu.be') {
			return urlObj.pathname.slice(1);
		}
	} catch (e) {
		// fallback to regex if URL parsing fails
	}
	const match = url.match(/(?:v=|youtu\.be\/)([\w-]+)/);
	return match?.[1] ?? null;
};

// Searches YouTube Music by artist + song name, scores candidates using Levenshtein distance,
// and returns the canonical YouTube Music link of the best match.
export const lookupYtMusicTrackByInfo = async (
	artist: string,
	song: string,
): Promise<string | null> => {
	const ytmusic = await getYTMusic();

	const results = await ytmusic.searchSongs(`${artist} ${song}`);
	if (results.length === 0) {
		return null;
	}

	const targetSignature = normalizeText(`${artist} - ${song}`);

	let bestCandidate: (typeof results)[number] | null = null;
	let lowestScore = Infinity;

	for (const candidate of results) {
		const candidateSignature = normalizeText(
			`${candidate.artist.name} - ${candidate.name}`,
		);
		const score = distance(targetSignature, candidateSignature);
		if (score < lowestScore) {
			lowestScore = score;
			bestCandidate = candidate;
		}
	}

	if (!bestCandidate) {
		return null;
	}

	return `https://music.youtube.com/watch?v=${bestCandidate.videoId}`;
};

// Resolves a YouTube Music link to a Deezer track (ISRC + link) by:
//   1. Extracting the video ID from the URL
//   2. Fetching metadata from YouTube Music API
//   3. Running a fuzzy Deezer search scored by Levenshtein distance
// Returns null if any step fails to produce a confident match.
export const lookupYtMusicTrackByLink = async (
	url: string,
): Promise<TrackInfo | null> => {
	const videoId = extractYtMusicId(url);
	if (!videoId) return null;

	const ytmusic = await getYTMusic();
	let songInfo: any;
	try {
		songInfo = await ytmusic.getSong(videoId);
	} catch (e) {
		return null; // e.g. video unavailable
	}

	if (!songInfo) return null;

	const artistName =
		Array.isArray(songInfo.artists) && songInfo.artists.length > 0
			? songInfo.artists[0].name
			: songInfo.artist?.name || songInfo.author || 'Unknown';

	const targetSignature = normalizeText(`${artistName} - ${songInfo.name}`);

	return pickBestDeezerTrack(targetSignature);
};
