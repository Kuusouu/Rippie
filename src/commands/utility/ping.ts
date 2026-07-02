import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	MessageFlags,
	SlashCommandBuilder,
} from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription(
			'Checks Discord latency and lets the milliseconds explain themselves.',
		),
	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		const websocketLatency = Math.round(interaction.client.ws.ping);
		const startTime = interaction.createdTimestamp;
		const roundtripLatency = Date.now() - startTime;

		const embed = new EmbedBuilder()
			.setColor(0x00ff00)
			.setTitle('🏓 Pong!')
			.addFields(
				{
					name: 'Roundtrip Latency',
					value: `${roundtripLatency}ms`,
					inline: true,
				},
				{
					name: 'WebSocket Latency',
					value: `${websocketLatency}ms`,
					inline: true,
				},
			)
			.setFooter({
				text: 'Lower is better. Occasionally much better.',
			});

		await interaction.reply({
			embeds: [embed],
			flags: MessageFlags.Ephemeral,
		});
	},
};
