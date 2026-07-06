import { distance } from 'fastest-levenshtein';
import type { TrackInfo } from '../types';

// Normalizes a string for fuzzy comparison by stripping punctuation, noise
// words, feature credits, and URL slug separators.
export const normalizeText = (text: string): string => {
	if (!text) return '';
	let cleaned = text.toLowerCase();

	// Convert URL/slug separators to spaces
	cleaned = cleaned.replace(/[-_]/g, ' ');

	// Strip punctuation elements
	cleaned = cleaned.replace(/[.,/#!$%^&*;:{}=\-_`~()[\]™]/g, '');

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

interface DeezerTrack {
	title: string;
	artist: { name: string };
	isrc?: string;
	link?: string;
}

interface DeezerResponse {
	data?: DeezerTrack[];
}

// Picks the best Deezer result for a given target signature using Levenshtein distance.
// This is heavily used by platforms that lack built-in ISRC resolving to bridge the gap.
export const pickBestDeezerTrack = async (
	targetSignature: string,
): Promise<TrackInfo | null> => {
	const deezerUrl = `https://api.deezer.com/search?q=${encodeURIComponent(targetSignature)}`;
	const res = await fetch(deezerUrl);
	const json = (await res.json()) as DeezerResponse;

	if (!json.data || !Array.isArray(json.data) || json.data.length === 0) {
		return null;
	}

	let bestTrack: DeezerTrack | null = null;
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
