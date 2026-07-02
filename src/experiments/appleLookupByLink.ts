import { lookupAppleTrackByLink } from '../core/appleMusic';

const main = async () => {
	const linkInput: string | undefined = process.argv[2];

	if (!linkInput) {
		console.log('\x1b[31m%s\x1b[0m', 'Error: Missing argument.');
		console.log(
			'Usage: bun run src/experiments/appleLookupByLink.ts "https://music.apple.com/us/album/..."',
		);
		process.exit(1);
	}

	const result = await lookupAppleTrackByLink(linkInput);

	if (result) {
		console.log('--- DEEZER BEST MATCH ---');
		console.log(`Title:       ${result.name}`);
		console.log(`Artist:      ${result.artists.join(', ')}`);
		console.log(`ISRC:        ${result.isrc}`);
		console.log(`Deezer Link: ${result.link}`);
	} else {
		console.log('Could not find a matching track on Deezer.');
	}
};

main().catch((error) => {
	console.error('Error:', error);
	process.exit(1);
});
