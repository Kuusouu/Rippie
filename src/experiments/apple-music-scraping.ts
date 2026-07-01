import { distance } from 'fastest-levenshtein';

// 1. Parse command-line parameters
const artistInput: string | undefined = process.argv[2];
const songInput: string | undefined = process.argv[3];

if (!artistInput || !songInput) {
	console.log('\x1b[31m%s\x1b[0m', 'Error: Missing arguments.');
	console.log(
		'Usage: npx ts-node apple-music-scraper.ts "Artist Name" "Song Title"',
	);
	process.exit(1);
}

interface ITunesResult {
	trackId: number;
	artistName: string;
	collectionName: string;
}

interface ITunesLookupResponse {
	results: ITunesResult[];
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

// Extract the track identity parameter (?i=12345) from the Apple Music URL
function extractTrackId(url: string): string | null {
	try {
		const match = url.match(/[?&]i=(\d+)/);
		return match ? match[1] : null;
	} catch (e) {
		return null;
	}
}

async function getBestTrack(artist: string, song: string): Promise<void> {
	// Combine for search query layout
	const searchQuery = `${artist} ${song}`;
	const searchUrl = `https://music.apple.com/us/search?term=${encodeURIComponent(searchQuery)}`;

	// Construct the target signature we are matching against
	const targetSignature = normalizeText(`${artist} - ${song}`);

	try {
		// Step 1: Scrape Apple Music's Server-Side Rendered Web Layout
		const response = await fetch(searchUrl, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
			},
		});

		const html = await response.text();
		const songBlockRegex =
			/"contentDescriptor":\s*\{\s*"kind"\s*:\s*"song"[\s\S]*?"url"\s*:\s*"(https:\/\/music\.apple\.com\/us\/album\/[^"\\?]+[^"]+\?i=\d+)"/g;
		const songMatches = [...html.matchAll(songBlockRegex)];

		if (songMatches.length === 0) {
			console.log(`No valid song links found matching "${searchQuery}".`);
			return;
		}

		const cleanUrls = songMatches.map((m) => m[1].replace(/\\\//g, '/'));
		const uniqueUrls = [...new Set(cleanUrls)];
		const topTrackUrls = uniqueUrls.slice(0, 5);

		console.log(`\nTarget Entry Signature: "${targetSignature}"`);
		console.log(
			`Evaluating top ${topTrackUrls.length} metadata targets via iTunes Database...`,
		);
		console.log(
			'--------------------------------------------------------------------',
		);

		// Step 2: Batch processing lookups via a single iTunes API request
		const trackItems = topTrackUrls
			.map((link) => ({ link, trackId: extractTrackId(link) }))
			.filter((item) => item.trackId !== null);

		const trackIds = trackItems.map((item) => item.trackId).join(',');

		let itunesResults: ITunesResult[] = [];
		if (trackIds) {
			try {
				const res = await fetch(
					`https://itunes.apple.com/lookup?id=${trackIds}`,
				);
				const data = (await res.json()) as ITunesLookupResponse;
				itunesResults = data.results || [];
			} catch (err) {
				// Handled silently to match original behavior
			}
		}

		let bestLink: string | null = null;
		let lowestMatchScore = Infinity;

		// Step 3: Evaluate combined structural text footprints
		trackItems.forEach(({ link, trackId }) => {
			const data = itunesResults.find(
				(r) => r.trackId.toString() === trackId,
			);
			if (!data) return;

			// Combine iTunes values into the exact same "artist - collection" layout pattern
			const rawItunesSignature = `${data.artistName} - ${data.collectionName}`;
			const cleanItunesSignature = normalizeText(rawItunesSignature);

			// Score the combined fields directly
			const matchScore = distance(targetSignature, cleanItunesSignature);

			console.log(
				` -> Track ID: ${data.trackId} | Combined Score: ${matchScore}`,
			);
			console.log(
				`    iTunes Data: "${rawItunesSignature}" -> Cleaned: "${cleanItunesSignature}"`,
			);
			console.log(`    Link: ${link}\n`);

			if (matchScore < lowestMatchScore) {
				lowestMatchScore = matchScore;
				bestLink = link;
			}
		});

		if (bestLink) {
			console.log('--- WINNING HYBRID TRACK SELECTION ---');
			console.log(`Verified Official Link: ${bestLink}`);
		} else {
			console.log(
				'\nCould not confidently isolate a validated song entry.',
			);
		}
	} catch (error: any) {
		console.error('Execution failed:', error.message);
	}
}

getBestTrack(artistInput, songInput);
