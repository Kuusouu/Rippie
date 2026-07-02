import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from 'discord.js';

const ownerUrl = 'https://github.com/omarnunezsiri';
const githubProject = 'https://github.com/Kuusouu/Rippie';
const supportUrl = 'https://discord.gg/';
const aboutThumbnailUrl = 'https://placehold.co/512x512/png?text=Rippie';

export default {
	data: new SlashCommandBuilder()
		.setName('about')
		.setDescription("View what Rippie's all about!"),
	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		const embed = new EmbedBuilder()
			.setColor(0x00ff00)
			.setAuthor({ name: 'Rippie', url: githubProject })
			.setThumbnail(aboutThumbnailUrl)
			.addFields({
				name: 'DEV:',
				value: `[vie](${ownerUrl})`,
				inline: false,
			});

		const view = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setLabel('GITHUB')
				.setURL(githubProject)
				.setStyle(ButtonStyle.Link),
			new ButtonBuilder()
				.setLabel('SUPPORT SERVER')
				.setURL(supportUrl)
				.setStyle(ButtonStyle.Link),
		);

		console.log('Sending about embed...');

		await interaction.reply({
			embeds: [embed],
			components: [view],
		});
	},
};
