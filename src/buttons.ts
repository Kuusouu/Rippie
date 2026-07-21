import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { ResolvedLinks } from './core/resolver';
import type { BotConfig } from './types';

// Purely presentational, takes data, returns Discord components.
// No knowledge of how links were resolved or which platform triggered the flow.
export const generatePlatformButtons = (
	guildPlatforms: Record<string, boolean>,
	botConfig: BotConfig,
	resolvedLinks: ResolvedLinks,
): ActionRowBuilder<ButtonBuilder>[] => {
	const buttons: ButtonBuilder[] = [];

	for (const [platform, url] of resolvedLinks) {
		// Skip platforms the guild hasn't enabled
		if (!guildPlatforms[platform]) continue;

		const serviceConfig = botConfig.services?.[platform];
		const emoji = serviceConfig?.emoji;

		const button = new ButtonBuilder()
			.setLabel(platform)
			.setURL(url)
			.setStyle(ButtonStyle.Link);

		if (emoji) {
			button.setEmoji(emoji);
		}

		buttons.push(button);
	}

	if (!buttons.length) return [];

	// Discord limits 5 buttons per action row
	const rows: ActionRowBuilder<ButtonBuilder>[] = [];
	for (let i = 0; i < buttons.length; i += 5) {
		rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(i, i + 5)));
	}

	return rows;
};
