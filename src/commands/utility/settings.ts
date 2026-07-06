import {
	ActionRowBuilder,
	ChatInputCommandInteraction,
	EmbedBuilder,
	MessageFlags,
	SlashCommandBuilder,
	StringSelectMenuBuilder,
} from 'discord.js';
import { getServiceEntries } from '../../config';
import { getSavedSettingsRoles, hasSettingsAccess } from '../../permissions';

const buildSettingsRolesText = (settingsRoleIds: string[]): string => {
	if (settingsRoleIds.length === 0) {
		return 'No roles have been configured yet.';
	}

	return settingsRoleIds.map((roleId) => `• <@&${roleId}>`).join('\n');
};

const buildMusicChannelText = (musicChannelId: string | undefined): string => {
	if (!musicChannelId) {
		return 'No music channel has been configured yet.';
	}

	return `Currently assigned channel: <#${musicChannelId}>`;
};

const buildMusicServicesText = (
	services: Record<string, boolean> | undefined,
	availableServices: Array<{ name: string; emoji: string }>,
): string => {
	const selectedServices = availableServices
		.filter(({ name }) => services?.[name])
		.map(({ name, emoji }) => `${emoji} ${name}`);

	if (selectedServices.length === 0) {
		return 'No music services have been configured yet.';
	}

	return `Currently assigned services:\n${selectedServices.join('\n')}`;
};

const buildSettingsAccessText = (settingsRoleIds: string[]): string => {
	if (settingsRoleIds.length === 0) {
		return 'Only server administrators can customize settings until roles are configured.';
	}

	return 'Only members with one of the roles above can customize settings.';
};

export default {
	data: new SlashCommandBuilder()
		.setName('settings')
		.setDescription('Configure the bot in your server'),
	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		const { config, settings } = interaction.client;

		const services = getServiceEntries(config);
		const settingsRoleIds = interaction.guildId
			? getSavedSettingsRoles(interaction.guildId, settings)
			: [];
		const musicChannelId = interaction.guildId
			? settings[interaction.guildId]?.musicChannelId
			: undefined;
		const guildServices = interaction.guildId
			? settings[interaction.guildId]?.services
			: undefined;

		if (!hasSettingsAccess(interaction, settingsRoleIds)) {
			await interaction.reply({
				content: 'You do not have access to change settings here.',
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const servicesText =
			services.length > 0
				? services.map(({ name, emoji }) => `${emoji} ${name}`).join('\n')
				: 'No services have been configured yet.';
		const musicServicesText = buildMusicServicesText(guildServices, services);
		const musicChannelText = buildMusicChannelText(musicChannelId);
		const settingsRolesText = buildSettingsRolesText(settingsRoleIds);
		const settingsAccessText = buildSettingsAccessText(settingsRoleIds);

		const embed = new EmbedBuilder()
			.setColor(0x00ff00)
			.setTitle('Configure Rippie')
			.setDescription('Choose what you want to configure from the menu below.')
			.addFields(
				{
					name: 'Music Channel',
					value: `Set the channel where Rippie will look for music links.\n${musicChannelText}`,
					inline: false,
				},
				{
					name: 'Music Services',
					value: `These are the services currently available:\n${servicesText}\n\n${musicServicesText}`,
					inline: false,
				},
				{
					name: 'Settings Roles',
					value: `These roles can configure settings:\n${settingsRolesText}\n\n${settingsAccessText}`,
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
					description: 'Pick the channel where Rippie will look for music links.',
					value: 'music_channel',
				},
				{
					label: 'Music services',
					description: 'Pick which music services this community uses.',
					value: 'music_services',
				},
				{
					label: 'Settings roles',
					description: 'Pick the roles that can change settings in this server.',
					value: 'settings_roles',
				},
			);

		const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);

		await interaction.reply({
			embeds: [embed],
			components: [row],
			flags: MessageFlags.Ephemeral,
		});
	},
};
