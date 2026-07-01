// Spotify ISRC Lookup Experiment
//
// Given an ISRC, queries the Spotify API to find the matching track
// and returns the track name, artist(s), and a canonical Spotify link.
//
// Usage: npx tsx src/experiments/spotify-isrc-lookup.ts <isrc>
// Example: npx tsx src/experiments/spotify-isrc-lookup.ts USBB10300001

import { lookupSpotifyTrackByIsrc } from '../core/spotify';

const main = async () => {
	const isrc = process.argv[2];
	if (!isrc) {
		console.error(
			'Usage: npx tsx src/experiments/spotify-isrc-lookup.ts <isrc>',
		);
		process.exit(1);
	}

	console.log(`Looking up ISRC: ${isrc}`);

	const track = await lookupSpotifyTrackByIsrc(isrc);
	if (!track) {
		console.error(`No track found for ISRC: ${isrc}`);
		process.exit(1);
	}

	const artists = track.artists.join(', ');

	console.log(`\nTrack: ${track.name}`);
	console.log(`Artist(s): ${artists}`);
	console.log(`Spotify ID: ${track.id}`);
	console.log(`Spotify Link: ${track.link}`);
};

main().catch((error) => {
	console.error('Error:', error);
	process.exit(1);
});
