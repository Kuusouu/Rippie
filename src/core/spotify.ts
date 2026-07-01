import { env } from '../env';

type SpotifyTokenResponse = {
	access_token: string;
	expires_in: number;
};

type SpotifyTrack = {
	name: string;
	artists: { name: string }[];
	external_ids: {
		isrc?: string;
	};
};

export type TrackInfo = {
	name: string;
	artists: string[];
	isrc: string | null;
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
	console.log(data.expires_in);
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
	};
};
