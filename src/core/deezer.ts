import type { TrackInfo } from '../types';

type DeezerTrack = {
	id: number;
	title: string;
	isrc: string;
	link: string;
	artist: {
		name: string;
	};
	error?: {
		type: string;
		message: string;
		code: number;
	};
};

export type DeezerTrackLookup = {
	id: number;
	name: string;
	artists: string[];
	isrc: string;
	link: string;
};

// Direct track links embed the numeric ID after /track/ (e.g., https://www.deezer.com/track/3135556)
const DIRECT_TRACK_ID_PATTERN = /(?:www\.)?deezer\.com\/(?:\w{2}\/)?track\/([0-9]+)/;

// Short share links (e.g., https://link.deezer.com/s/33HJubg3npxgAGfoCij0m) redirect to the full URL.
// We follow the redirect to resolve the track ID.
const SHORT_LINK_PATTERN = /link\.deezer\.com\/s\//;

export const extractDeezerTrackId = async (url: string): Promise<string | null> => {
	// Try the direct format first
	const directMatch = url.match(DIRECT_TRACK_ID_PATTERN);
	if (directMatch) {
		return directMatch[1] ?? null;
	}

	// For short links, follow the redirect and extract the ID from the resolved URL
	if (SHORT_LINK_PATTERN.test(url)) {
		const response = await fetch(url, {
			method: 'HEAD',
			redirect: 'follow',
		});

		const resolvedUrl = response.url;
		const resolvedMatch = resolvedUrl.match(DIRECT_TRACK_ID_PATTERN);
		return resolvedMatch?.[1] ?? null;
	}

	return null;
};

export const fetchDeezerTrackInfo = async (trackId: string): Promise<TrackInfo> => {
	const response = await fetch(`https://api.deezer.com/track/${trackId}`);

	if (!response.ok) {
		throw new Error(`Deezer track fetch failed: ${response.status} ${response.statusText}`);
	}

	const track = (await response.json()) as DeezerTrack;

	// Deezer returns a 200 with an error body when the track isn't found
	if (track.error) {
		throw new Error(`Deezer API error: ${track.error.message} (code ${track.error.code})`);
	}

	return {
		name: track.title,
		artists: [track.artist.name],
		isrc: track.isrc ?? null,
		link: track.link ?? null,
	};
};

// Looks up a track by ISRC using the Deezer public API.
// Returns the track ID, name, artist(s), ISRC, and a canonical Deezer link.
export const lookupDeezerTrackByIsrc = async (isrc: string): Promise<DeezerTrackLookup> => {
	const response = await fetch(`https://api.deezer.com/track/isrc:${encodeURIComponent(isrc)}`);

	if (!response.ok) {
		throw new Error(`Deezer ISRC lookup failed: ${response.status} ${response.statusText}`);
	}

	const track = (await response.json()) as DeezerTrack;

	// Deezer returns a 200 with an error body when the ISRC has no match
	if (track.error) {
		throw new Error(`Deezer API error: ${track.error.message} (code ${track.error.code})`);
	}

	return {
		id: track.id,
		name: track.title,
		artists: [track.artist.name],
		isrc: track.isrc,
		link: `https://www.deezer.com/en/track/${track.id}`,
	};
};
