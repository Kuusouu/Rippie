// Deezer API Experiment
//
// Thin CLI wrapper around the shared deezer.ts module that verifies the
// full flow works end-to-end: extract/resolve a track ID from a URL,
// fetch metadata from the public Deezer API, and print the ISRC.
//
// Supports both direct links (deezer.com/track/{id}) and short share
// links (link.deezer.com/s/...) which are resolved via HTTP redirect.
//
// Usage: bun run src/experiments/deezerLookupById.ts <deezer-track-url>
// Example: bun run src/experiments/deezerLookupById.ts https://link.deezer.com/s/33HJubg3npxgAGfoCij0m

import { extractDeezerTrackId, fetchDeezerTrackInfo } from '../core/deezer';

const main = async () => {
	const url = process.argv[2];
	if (!url) {
		console.error('Usage: bun run src/experiments/deezerLookupById.ts <deezer-track-url>');
		process.exit(1);
	}

	console.log('Resolving track ID...');
	const trackId = await extractDeezerTrackId(url);
	if (!trackId) {
		console.error(`Could not extract a track ID from: ${url}`);
		process.exit(1);
	}

	console.log(`Track ID: ${trackId}`);
	console.log('Fetching track metadata from Deezer...');

	const track = await fetchDeezerTrackInfo(trackId);
	const artists = track.artists.join(', ');

	console.log(`\nTrack: ${track.name}`);
	console.log(`Artist(s): ${artists}`);
	console.log(`ISRC: ${track.isrc ?? 'Not available'}`);
};

main().catch((error) => {
	console.error('Error:', error);
	process.exit(1);
});
