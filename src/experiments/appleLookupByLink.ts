import { distance } from 'fastest-levenshtein';

const linkInput: string | undefined = process.argv[2];

if (!linkInput) {
	console.log('\x1b[31m%s\x1b[0m', 'Error: Missing argument.');
	console.log(
		'Usage: npx ts-node src/experiments/appleLookupByLink.ts "https://music.apple.com/us/album/..."',
	);
	process.exit(1);
}

// Normalize strings by removing punctuation, spaces, and extra release tags
function normalizeText(text: string): string {
	if (!text) return '';
	let cleaned = text.toLowerCase();

	// Convert URL/slug separators to spaces
	cleaned = cleaned.replace(/[-_]/g, ' ');

	// Strip punctuation elements
	cleaned = cleaned.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\[\]™]/g, '');

	// Truncate anything trailing feature artist credits
	cleaned = cleaned.replace(/\b(feat|ft|featuring)\b[\s\S]*/g, '');

	// Clean standalone noise words
	const noiseWords = [
		'official',
		'remastered',
		'remaster',
		'explicit',
		'audio',
		'video',
		'single',
		'album',
		'version',
	];
	noiseWords.forEach((word) => {
		const regex = new RegExp(`\\b${word}\\b`, 'g');
		cleaned = cleaned.replace(regex, '');
	});

	return cleaned.replace(/\s+/g, ' ').trim();
}

function extractTrackId(url: string): string | null {
	try {
		// First try to find ?i= for a specific track
		const trackMatch = url.match(/[?&]i=(\d+)/);
		if (trackMatch) return trackMatch[1];
		
		// Fallback to the album ID at the end of the URL path
		const albumMatch = url.match(/\/(\d+)(?:\?|$)/);
		return albumMatch ? albumMatch[1] : null;
	} catch (e) {
		return null;
	}
}

async function runExperiment() {
	const trackId = extractTrackId(linkInput!);
	if (!trackId) {
		console.error('Could not extract Track ID from the provided link.');
		return;
	}

	console.log(`Extracted Track ID: ${trackId}`);
	console.log('Fetching from iTunes API...');

	let itunesData: any = null;
	try {
		const res = await fetch(
			`https://itunes.apple.com/lookup?id=${trackId}`,
		);
		const json = await res.json();
		if (json.results && json.results.length > 0) {
			itunesData = json.results[0];
		}
	} catch (err) {
		console.error('iTunes API error:', err);
		return;
	}

	if (!itunesData) {
		console.error('No results found in iTunes API for that ID.');
		return;
	}

	const artistName = itunesData.artistName;
	const trackName = itunesData.trackName || itunesData.collectionName;

	console.log(`iTunes Data Found: "${artistName} - ${trackName}"`);

	const targetSignature = normalizeText(`${artistName} - ${trackName}`);
	console.log(`Target Signature: "${targetSignature}"`);

	// Deezer Fuzzy Search (using normalized signature to avoid strict punctuation/label mismatches)
	const deezerUrl = `https://api.deezer.com/search?q=${encodeURIComponent(
		targetSignature,
	)}`;

	console.log(`\nQuerying Deezer API: ${deezerUrl}`);

	try {
		const deezerRes = await fetch(deezerUrl);
		const deezerJson = await deezerRes.json();

		if (
			deezerJson.data &&
			Array.isArray(deezerJson.data) &&
			deezerJson.data.length > 0
		) {
			let bestTrack: any = null;
			let lowestScore = Infinity;

			deezerJson.data.forEach((track: any) => {
				const deezerSignature = normalizeText(
					`${track.artist.name} - ${track.title}`,
				);
				const score = distance(targetSignature, deezerSignature);

				if (score < lowestScore) {
					lowestScore = score;
					bestTrack = track;
				}
			});

			if (bestTrack) {
				console.log('\n--- DEEZER BEST MATCH ---');
				console.log(`Title: ${bestTrack.title}`);
				console.log(`ISRC: ${bestTrack.isrc}`);
				console.log(`Deezer Link: ${bestTrack.link}`);
			} else {
				console.log('\nNo confident match found in Deezer results.');
			}
		} else {
			console.log('No tracks found in Deezer response.');
		}
	} catch (err) {
		console.error('Deezer API error:', err);
	}
}

runExperiment();
