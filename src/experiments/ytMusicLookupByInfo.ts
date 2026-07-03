import { lookupYtMusicTrackByInfo } from '../core/ytMusic';

const main = async () => {
	const artistInput: string | undefined = process.argv[2];
	const songInput: string | undefined = process.argv[3];

	if (!artistInput || !songInput) {
		console.log('\x1b[31m%s\x1b[0m', 'Error: Missing arguments.');
		console.log(
			'Usage: bun run src/experiments/ytMusicLookupByInfo.ts "Artist Name" "Song Title"',
		);
		process.exit(1);
	}

	const link = await lookupYtMusicTrackByInfo(artistInput, songInput);

	if (link) {
		console.log('--- YT MUSIC BEST MATCH ---');
		console.log(`Link: ${link}`);
	} else {
		console.log('Could not confidently isolate a validated song entry.');
	}
};

main().catch((error) => {
	console.error('Error:', error);
	process.exit(1);
});
