export const Platform = {
	Spotify: 'Spotify',
	AppleMusic: 'Apple Music',
	YouTubeMusic: 'YouTube Music',
} as const;

export type Platform = (typeof Platform)[keyof typeof Platform];

const platformPatterns: { platform: Platform; pattern: RegExp }[] = [
	{
		platform: Platform.Spotify,
		pattern: /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/,
	},
	{
		platform: Platform.AppleMusic,
		pattern: /music\.apple\.com\/[a-z]{2}\/(album|song)\/[^/]+\/(\d+)/,
	},
	{
		platform: Platform.YouTubeMusic,
		pattern: /music\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
	},
];

export const detectMusicPlatform = (url: string): Platform | null => {
	for (const { platform, pattern } of platformPatterns) {
		if (pattern.test(url)) {
			return platform;
		}
	}
	return null;
};
