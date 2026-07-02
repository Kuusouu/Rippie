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
): Promise<{
	isrc: string;
	link: string;
	name: string;
	artist: string;
} | null> => {
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
		name: bestTrack.title,
		artist: bestTrack.artist.name,
	};
};

const extractYoutubeId = (url: string): string | null => {
	try {
		const urlObj = new URL(url);
		if (urlObj.searchParams.has('v')) {
			return urlObj.searchParams.get('v');
		}
		if (urlObj.hostname === 'youtu.be') {
			return urlObj.pathname.slice(1);
		}
	} catch (e) {
		// fallback to regex if URL parsing fails
	}
	const match = url.match(/(?:v=|youtu\.be\/)([\w-]+)/);
	return match?.[1] ?? null;
};

// --- Main ---

const main = async () => {
	const linkInput: string | undefined = process.argv[2];

	if (!linkInput) {
		console.log('\x1b[31m%s\x1b[0m', 'Error: Missing argument.');
		console.log(
			'Usage: bun run src/experiments/yt2.ts "https://music.youtube.com/watch?v=..."',
		);
		process.exit(1);
	}

	const videoId = extractYoutubeId(linkInput);
	if (!videoId) {
		console.error(`Could not extract a video ID from: ${linkInput}`);
		process.exit(1);
	}

	console.log(`Video ID: ${videoId}`);

	// Initialize the YT Music client
	const ytmusic = new YTMusic();
	await ytmusic.initialize();

	console.log('Fetching track metadata from YT Music...');
	// Casting to any to handle slightly varying artist properties in SongFull
	const songInfo = (await ytmusic.getSong(videoId)) as any;

	const artistName =
		Array.isArray(songInfo.artists) && songInfo.artists.length > 0
			? songInfo.artists[0].name
			: songInfo.artist?.name || songInfo.author || 'Unknown';

	console.log('\n--- YT MUSIC MATCH ---');
	console.log(`Name:   ${songInfo.name}`);
	console.log(`Artist: ${artistName}`);

	// Now cross-reference with Deezer to get the ISRC and canonical Deezer link
	console.log('\n--- DEEZER CROSS-REFERENCE ---');
	const deezer = await pickBestDeezerTrack(
		normalizeText(`${artistName} - ${songInfo.name}`),
	);

	if (deezer) {
		console.log(`Title:       ${deezer.name}`);
		console.log(`Artist:      ${deezer.artist}`);
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
