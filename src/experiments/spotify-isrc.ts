// Spotify API Experiment
//
// Given a Spotify track link, extract the track ID, authenticate with
// the Spotify Web API using the Client Credentials flow, fetch the track
// metadata, and display its ISRC (International Standard Recording Code).
//
// Usage: npx tsx src/experiments/spotify-isrc.ts <spotify-track-url>
// Example: npx tsx src/experiments/spotify-isrc.ts https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh

import { env } from '../env';

const SPOTIFY_TRACK_PATTERN = /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/;

const extractTrackId = (url: string): string | null => {
	const match = url.match(SPOTIFY_TRACK_PATTERN);
	return match?.[1] ?? null;
};

const getAccessToken = async (): Promise<string> => {
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
			`Failed to get access token: ${response.status} ${response.statusText}`,
		);
	}

	const data = (await response.json()) as { access_token: string };
	return data.access_token;
};

type SpotifyTrack = {
	name: string;
	artists: { name: string }[];
	external_ids: {
		isrc?: string;
	};
};

const getTrack = async (
	token: string,
	trackId: string,
): Promise<SpotifyTrack> => {
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
			`Failed to fetch track: ${response.status} ${response.statusText}`,
		);
	}

	return (await response.json()) as SpotifyTrack;
};

const main = async () => {
	const url = process.argv[2];
	if (!url) {
		console.error('Usage: spotify-isrc <spotify-track-url>');
		process.exit(1);
	}

	const trackId = extractTrackId(url);
	if (!trackId) {
		console.error(`Could not extract a track ID from: ${url}`);
		process.exit(1);
	}

	console.log(`Track ID: ${trackId}`);
	console.log('Authenticating with Spotify...');

	const token = await getAccessToken();
	console.log(`Authenticated. Fetching track metadata...`);

	const track = await getTrack(token, trackId);
	const artists = track.artists.map((a) => a.name).join(', ');

	console.log(`\nTrack: ${track.name}`);
	console.log(`Artist(s): ${artists}`);
	console.log(`ISRC: ${track.external_ids.isrc ?? 'Not available'}`);
};

main().catch((error) => {
	console.error('Error:', error);
	process.exit(1);
});
