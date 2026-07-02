// Spotify API Experiment
//
// Thin CLI wrapper around the shared spotify.ts module that verifies the
// full flow works end-to-end: extract a track ID from a URL, authenticate,
// fetch metadata, and print the ISRC.
//
// Usage: bun run src/experiments/spotifyLookupById.ts <spotify-track-url>
// Example: bun run src/experiments/spotifyLookupById.ts https://open.spotify.com/track/....

import { extractSpotifyTrackId, fetchSpotifyTrackInfo } from '../core/spotify';

const main = async () => {
	const url = process.argv[2];
	if (!url) {
		console.error(
			'Usage: bun run src/experiments/spotifyLookupById.ts <spotify-track-url>',
		);
		process.exit(1);
	}

	const trackId = extractSpotifyTrackId(url);
	if (!trackId) {
		console.error(`Could not extract a track ID from: ${url}`);
		process.exit(1);
	}

	console.log(`Track ID: ${trackId}`);
	console.log('Authenticating with Spotify...');

	const track = await fetchSpotifyTrackInfo(trackId);
	const artists = track.artists.join(', ');

	console.log(`\nTrack: ${track.name}`);
	console.log(`Artist(s): ${artists}`);
	console.log(`ISRC: ${track.isrc ?? 'Not available'}`);
};

main().catch((error) => {
	console.error('Error:', error);
	process.exit(1);
});
