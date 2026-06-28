import {
	ActionRowBuilder,
	ChatInputCommandInteraction,
	EmbedBuilder,
	MessageFlags,
	SlashCommandBuilder,
	StringSelectMenuBuilder,
} from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';

type ServiceConfig = {
	emoji: string;
};

type BotConfig = {
	services?: Record<string, ServiceConfig>;
};

const configPath = path.join(__dirname, '../../../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('settings')
		.setDescription('Configure the bot in your server'),
	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		const config = JSON.parse(
			fs.readFileSync(configPath, 'utf8'),
		) as BotConfig;
		const services = Object.entries(config.services ?? {}) as Array<
			[string, ServiceConfig]
		>;

		const servicesText =
			services.length > 0
				? services
						.map(([name, service]) => `${service.emoji} ${name}`)
						.join('\n')
				: 'No services have been configured yet.';

		const embed = new EmbedBuilder()
			.setColor(0x00ff00)
			.setTitle('Configure Rippie')
			.setDescription(
				'Choose what you want to configure from the menu below.',
			)
			.addFields(
				{
					name: 'Music Channel',
					value: 'Set the channel where Rippie will look for music links.',
					inline: false,
				},
				{
					name: 'Music Services',
					value: `These are the services currently available:\n${servicesText}`,
					inline: false,
				},
			)
			.setFooter({
				text: 'This will branch into each configuration flow next.',
			});

		const menu = new StringSelectMenuBuilder()
			.setCustomId('settings:category')
			.setPlaceholder('Choose a configuration area')
			.addOptions(
				{
					label: 'Music channel',
					description:
						'Pick the channel where Rippie will look for music links.',
					value: 'music_channel',
				},
				{
					label: 'Music services',
					description:
						'Pick which music services this community uses.',
					value: 'music_services',
				},
			);

		const row =
			new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);

		await interaction.reply({
			embeds: [embed],
			components: [row],
			flags: MessageFlags.Ephemeral,
		});
	},
};
