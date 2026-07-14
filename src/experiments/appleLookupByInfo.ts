// Apple Lookup By Info Experiment
//
// Manual testing script to verify the hybrid Apple Music scraping approach.
//
// Usage: bun run src/experiments/appleLookupByInfo.ts "Artist Name" "Song Title"

import { lookupAppleTrackByInfo } from '../core/appleMusic';

const main = async () => {
	const artistInput: string | undefined = process.argv[2];
	const songInput: string | undefined = process.argv[3];

	if (!artistInput || !songInput) {
		console.log('\x1b[31m%s\x1b[0m', 'Error: Missing arguments.');
		console.log(
			'Usage: bun run src/experiments/appleLookupByInfo.ts "Artist Name" "Song Title"',
		);
		process.exit(1);
	}

	const link = await lookupAppleTrackByInfo(artistInput, songInput);

	if (link) {
		console.log('--- WINNING HYBRID TRACK SELECTION ---');
		console.log(`Verified Official Link: ${link}`);
	} else {
		console.log('Could not confidently isolate a validated song entry.');
	}
};

main().catch((error) => {
	console.error('Error:', error);
	process.exit(1);
});
