import { distance } from 'fastest-levenshtein';
import YTMusic from 'ytmusic-api';

// --- Types ---

type DeezerSearchTrack = {
	id: number;
	title: string;
	isrc: string;
	link: string;
	artist: { name: string };
};

type DeezerSearchResponse = {
	data: DeezerSearchTrack[];
};

// --- Utilities ---

// Normalizes a string for fuzzy comparison by stripping punctuation, noise
// words, feature credits, and URL slug separators.
const normalizeText = (text: string): string => {
	if (!text) return '';
	let cleaned = text.toLowerCase();
	cleaned = cleaned.replace(/[-_]/g, ' ');
	cleaned = cleaned.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\[\]™]/g, '');
	cleaned = cleaned.replace(/\b(feat|ft|featuring)\b[\s\S]*/g, '');
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
};

// Searches Deezer for a target signature and picks the best match using
// Levenshtein distance. Returns ISRC + Deezer link, or null if no match.
const pickBestDeezerTrack = async (
	targetSignature: string,
): Promise<{ isrc: string; link: string } | null> => {
	const res = await fetch(
		`https://api.deezer.com/search?q=${encodeURIComponent(targetSignature)}`,
	);
	const json = (await res.json()) as DeezerSearchResponse;

	if (!json.data || !Array.isArray(json.data) || json.data.length === 0) {
		return null;
	}

	let bestTrack: DeezerSearchTrack | null = null;
	let lowestScore = Infinity;

	for (const track of json.data) {
		const deezerSignature = normalizeText(
			`${track.artist.name} - ${track.title}`,
		);
		const score = distance(targetSignature, deezerSignature);
		if (score < lowestScore) {
			lowestScore = score;
			bestTrack = track;
		}
	}

	if (!bestTrack) return null;

	return {
		isrc: bestTrack.isrc,
		link: bestTrack.link,
	};
};

// --- Main ---

const main = async () => {
	const artistInput: string | undefined = process.argv[2];
	const songInput: string | undefined = process.argv[3];

	if (!artistInput || !songInput) {
		console.log('\x1b[31m%s\x1b[0m', 'Error: Missing arguments.');
		console.log(
			'Usage: bun run src/experiments/yt.ts "Artist Name" "Song Title"',
		);
		process.exit(1);
	}

	// Initialize the YT Music client
	const ytmusic = new YTMusic();
	await ytmusic.initialize();

	const results = await ytmusic.search(`${artistInput} ${songInput}`);

	// Prioritize SONG results, fall back to ALBUM if none found
	const songs = results.filter((r) => r.type === 'SONG');
	const albums = results.filter((r) => r.type === 'ALBUM');
	const candidates = songs.length > 0 ? songs : albums;

	if (candidates.length === 0) {
		console.log('No SONG or ALBUM results found on YouTube Music.');
		process.exit(1);
	}

	// Score each candidate by Levenshtein distance against our target signature
	const targetSignature = normalizeText(`${artistInput} - ${songInput}`);

	let bestCandidate: (typeof candidates)[number] | null = null;
	let lowestScore = Infinity;

	for (const candidate of candidates) {
		const candidateSignature = normalizeText(
			`${candidate.artist.name} - ${candidate.name}`,
		);
		const score = distance(targetSignature, candidateSignature);
		if (score < lowestScore) {
			lowestScore = score;
			bestCandidate = candidate;
		}
	}

	if (!bestCandidate) {
		console.log('Could not confidently select a YouTube Music candidate.');
		process.exit(1);
	}

	const ytLink =
		'videoId' in bestCandidate
			? `https://music.youtube.com/watch?v=${bestCandidate.videoId}`
			: `https://music.youtube.com/browse/${bestCandidate.albumId}`;

	console.log('--- BEST YT MUSIC MATCH ---');
	console.log(`Type:   ${bestCandidate.type}`);
	console.log(`Name:   ${bestCandidate.name}`);
	console.log(`Artist: ${bestCandidate.artist.name}`);
	console.log(`Link:   ${ytLink}`);

	// Now cross-reference with Deezer to get the ISRC and canonical Deezer link
	console.log('\n--- DEEZER CROSS-REFERENCE ---');
	const deezer = await pickBestDeezerTrack(
		normalizeText(`${bestCandidate.artist.name} - ${bestCandidate.name}`),
	);

	if (deezer) {
		console.log(`ISRC:        ${deezer.isrc}`);
		console.log(`Deezer Link: ${deezer.link}`);
	} else {
		console.log('Could not find a matching track on Deezer.');
	}
};

main().catch((error) => {
	console.error('Error:', error);
	process.exit(1);
});
