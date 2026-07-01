// Deezer ISRC Lookup Experiment
//
// Given an ISRC, queries the Deezer public API to find the matching track
// and returns the track name, artist(s), and a canonical Deezer link.
//
// No auth required — the Deezer API is public for catalogue lookups.
// Endpoint: GET https://api.deezer.com/track/isrc:{ISRC}
//
// Usage: npx tsx src/experiments/deezer-isrc-lookup.ts <isrc>
// Example: npx tsx src/experiments/deezer-isrc-lookup.ts GBDUW0000059

import { lookupDeezerTrackByIsrc } from '../core/deezer';

const main = async () => {
	const isrc = process.argv[2];
	if (!isrc) {
		console.error(
			'Usage: npx tsx src/experiments/deezer-isrc-lookup.ts <isrc>',
		);
		process.exit(1);
	}

	console.log(`Looking up ISRC: ${isrc}`);

	const track = await lookupDeezerTrackByIsrc(isrc);
	const artists = track.artists.join(', ');

	console.log(`\nTrack: ${track.name}`);
	console.log(`Artist(s): ${artists}`);
	console.log(`Deezer ID: ${track.id}`);
	console.log(`Deezer Link: ${track.link}`);
};

main().catch((error) => {
	console.error('Error:', error);
	process.exit(1);
});
