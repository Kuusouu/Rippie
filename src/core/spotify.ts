import { env } from '../env';
import { TrackInfo } from '../types';

type SpotifyTokenResponse = {
	access_token: string;
	expires_in: number;
};

type SpotifyTrack = {
	id: string;
	name: string;
	artists: { name: string }[];
	external_ids: {
		isrc?: string;
	};
};

type SpotifySearchResponse = {
	tracks: {
		items: SpotifyTrack[];
	};
};

export type SpotifyTrackLookup = {
	id: string;
	name: string;
	artists: string[];
	isrc: string;
	link: string;
};

// Spotify links always contain the track ID at the end before the query params (e.g., https://open.spotify.com/track/<id>?...)
const TRACK_ID_PATTERN = /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/;

export const extractSpotifyTrackId = (url: string): string | null => {
	const match = url.match(TRACK_ID_PATTERN);
	return match?.[1] ?? null;
};

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

const getAccessToken = async (): Promise<string> => {
	if (cachedToken && Date.now() < tokenExpiresAt) {
		return cachedToken;
	}

	const credentials = Buffer.from(
		`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`,
	).toString('base64');

	const response = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			Authorization: `Basic ${credentials}`,
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: 'grant_type=client_credentials',
	});

	if (!response.ok) {
		throw new Error(
			`Spotify auth failed: ${response.status} ${response.statusText}`,
		);
	}

	const data = (await response.json()) as SpotifyTokenResponse;

	cachedToken = data.access_token;
	tokenExpiresAt = Date.now() + data.expires_in * 1000 - 60_000; // 60s buffer so it doesn't expire mid request

	return cachedToken;
};

export const fetchSpotifyTrackInfo = async (
	trackId: string,
): Promise<TrackInfo> => {
	const token = await getAccessToken();

	const response = await fetch(
		`https://api.spotify.com/v1/tracks/${trackId}`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);

	if (!response.ok) {
		throw new Error(
			`Spotify track fetch failed: ${response.status} ${response.statusText}`,
		);
	}

	const track = (await response.json()) as SpotifyTrack;
	return {
		name: track.name,
		artists: track.artists.map((a) => a.name),
		isrc: track.external_ids.isrc ?? null,
		link: `https://open.spotify.com/track/${track.id}`,
	};
};

export const lookupSpotifyTrackByIsrc = async (
	isrc: string,
): Promise<SpotifyTrackLookup | null> => {
	const token = await getAccessToken();

	const url = new URL('https://api.spotify.com/v1/search');
	url.searchParams.set('q', `isrc:${isrc}`);
	url.searchParams.set('type', 'track');
	url.searchParams.set('limit', '1');

	const response = await fetch(url.toString(), {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	if (!response.ok) {
		throw new Error(
			`Spotify ISRC search failed: ${response.status} ${response.statusText}`,
		);
	}

	const data = (await response.json()) as SpotifySearchResponse;

	if (!data.tracks.items.length) {
		return null;
	}

	const track = data.tracks.items[0];

	return {
		id: track.id,
		name: track.name,
		artists: track.artists.map((a) => a.name),
		isrc: track.external_ids.isrc ?? isrc, // fallback to provided isrc if missing from response
		link: `https://open.spotify.com/track/${track.id}`,
	};
};
