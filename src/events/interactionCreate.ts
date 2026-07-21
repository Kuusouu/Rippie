import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelSelectMenuBuilder,
	ChannelType,
	type Client,
	EmbedBuilder,
	Events,
	MessageFlags,
	RoleSelectMenuBuilder,
	StringSelectMenuBuilder,
} from 'discord.js';
import { getServiceEntries, saveSettings } from '../config';
import { getSavedSettingsRoles, hasSettingsAccess } from '../permissions';

const getSelectionKey = (guildId: string | null, userId: string): string =>
	`${guildId ?? 'dm'}:${userId}`;

// State Maps
// Note: This can leak memory if users open a menu but never click "Accept".
const pendingMusicServicesSelections = new Map<string, string[]>();
const pendingSettingsRoleSelections = new Map<string, string[]>();

const getSavedMusicServices = (client: Client, guildId: string | null): string[] => {
	if (!guildId) {
		return [];
	}

	const guildSettings = client.settings[guildId];
	if (!guildSettings?.services) {
		return [];
	}

	return getServiceEntries(client.config)
		.filter(({ name }) => guildSettings.services?.[name])
		.map(({ name }) => name);
};

// Payload Builders

const buildMusicServicesPayload = (client: Client, selectedServices: string[]) => {
	const selectedSummary =
		selectedServices.length > 0
			? selectedServices.map((name) => `• ${name}`).join('\n')
			: 'Nothing selected yet.';

	const embed = new EmbedBuilder()
		.setColor(0x00ff00)
		.setTitle('Configure Music Services')
		.setDescription('Select the services this community wants, then accept the changes.')
		.addFields({
			name: 'Current selection',
			value: selectedSummary,
			inline: false,
		});

	const serviceEntries = getServiceEntries(client.config);

	const selectMenu = new StringSelectMenuBuilder()
		.setCustomId('settings:music_services')
		.setPlaceholder('Check the music services this server uses')
		.setMinValues(0)
		.setMaxValues(serviceEntries.length)
		.addOptions(
			serviceEntries.map(({ name, emoji }) => ({
				label: name,
				emoji,
				value: name,
				default: selectedServices.includes(name),
			})),
		);

	const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

	const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId('settings:music_services:accept')
			.setLabel('Accept')
			.setStyle(ButtonStyle.Success),
	);

	return {
		embeds: [embed],
		components: [selectRow, actionRow],
	};
};

const buildSettingsRolesPayload = (selectedRoles: string[]) => {
	const selectedSummary =
		selectedRoles.length > 0
			? selectedRoles.map((roleId) => `• <@&${roleId}>`).join('\n')
			: 'No roles selected yet.';

	const embed = new EmbedBuilder()
		.setColor(0x00ff00)
		.setTitle('Configure Settings Roles')
		.setDescription('Select the roles that can customize settings, then accept the changes.')
		.addFields({
			name: 'Current selection',
			value: selectedSummary,
			inline: false,
		});

	const selectMenu = new RoleSelectMenuBuilder()
		.setCustomId('settings:settings_roles')
		.setPlaceholder('Choose the roles allowed to manage settings')
		.setMinValues(0)
		.setMaxValues(25);

	if (selectedRoles.length > 0) {
		selectMenu.setDefaultRoles(selectedRoles);
	}

	const selectRow = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(selectMenu);

	const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId('settings:settings_roles:accept')
			.setLabel('Accept')
			.setStyle(ButtonStyle.Success),
	);

	return {
		embeds: [embed],
		components: [selectRow, actionRow],
	};
};

export const registerInteractionCreateHandler = (client: Client): void => {
	client.on(Events.InteractionCreate, async (interaction) => {
		if ('customId' in interaction && interaction.customId.startsWith('settings:')) {
			if (
				!hasSettingsAccess(
					interaction,
					getSavedSettingsRoles(interaction.guildId, client.settings),
				)
			) {
				await interaction.reply({
					content: 'You do not have access to change settings here.',
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
		}

		// Handle Channel Selection
		if (interaction.isChannelSelectMenu()) {
			if (interaction.customId !== 'settings:music_channel') return;

			const selectedChannelId = interaction.values[0];
			if (interaction.guildId) {
				const guildSettings = client.settings[interaction.guildId] ?? {};
				guildSettings.musicChannelId = selectedChannelId;
				client.settings[interaction.guildId] = guildSettings;
				saveSettings(client);
			}

			await interaction.reply({
				content: `Music channel set to <#${selectedChannelId}> and saved.`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		// Handle Role Selection
		if (interaction.isRoleSelectMenu()) {
			if (interaction.customId !== 'settings:settings_roles') return;

			const key = getSelectionKey(interaction.guildId, interaction.user.id);
			pendingSettingsRoleSelections.set(key, interaction.values);

			await interaction.update({
				...buildSettingsRolesPayload(interaction.values),
			});
			return;
		}

		// Handle String Dropdowns
		if (interaction.isStringSelectMenu()) {
			if (interaction.customId === 'settings:music_services') {
				const key = getSelectionKey(interaction.guildId, interaction.user.id);
				pendingMusicServicesSelections.set(key, interaction.values);

				await interaction.update({
					...buildMusicServicesPayload(client, interaction.values),
				});
				return;
			}

			if (interaction.customId !== 'settings:category') return;

			const selectedChoice = interaction.values[0];
			if (selectedChoice === 'music_channel') {
				const channelMenu = new ChannelSelectMenuBuilder()
					.setCustomId('settings:music_channel')
					.setPlaceholder('Choose a public channel')
					.setChannelTypes([
						ChannelType.GuildText,
						ChannelType.GuildAnnouncement,
						ChannelType.GuildForum,
					]);

				await interaction.reply({
					content: 'Choose the public channel where music should be posted.',
					components: [
						{
							type: 1,
							components: [channelMenu],
						},
					],
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			if (selectedChoice === 'music_services') {
				const key = getSelectionKey(interaction.guildId, interaction.user.id);
				const selectedServices = getSavedMusicServices(client, interaction.guildId);
				pendingMusicServicesSelections.set(key, selectedServices);

				await interaction.reply({
					...buildMusicServicesPayload(client, selectedServices),
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			if (selectedChoice === 'settings_roles') {
				const key = getSelectionKey(interaction.guildId, interaction.user.id);
				const selectedRoles = getSavedSettingsRoles(interaction.guildId, client.settings);
				pendingSettingsRoleSelections.set(key, selectedRoles);

				await interaction.reply({
					...buildSettingsRolesPayload(selectedRoles),
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			return;
		}

		// Handle Button Clicks
		if (interaction.isButton()) {
			if (
				!interaction.customId.startsWith('settings:music_services:') &&
				!interaction.customId.startsWith('settings:settings_roles:')
			) {
				return;
			}

			if (interaction.customId.startsWith('settings:music_services:')) {
				const key = getSelectionKey(interaction.guildId, interaction.user.id);
				const selectedServices =
					pendingMusicServicesSelections.get(key) ??
					getSavedMusicServices(client, interaction.guildId);

				if (interaction.customId === 'settings:music_services:accept') {
					if (interaction.guildId) {
						const guildSettings = client.settings[interaction.guildId] ?? {};
						guildSettings.services = Object.fromEntries(
							getServiceEntries(client.config).map(({ name }) => [
								name,
								selectedServices.includes(name),
							]),
						);
						client.settings[interaction.guildId] = guildSettings;
						saveSettings(client);
					}

					pendingMusicServicesSelections.delete(key);
					await interaction.update({
						content: `Music services saved: ${
							selectedServices.length > 0
								? selectedServices.join(', ')
								: 'none selected'
						}.`,
						embeds: [],
						components: [],
					});
					return;
				}

				return;
			}

			const key = getSelectionKey(interaction.guildId, interaction.user.id);
			const selectedRoles =
				pendingSettingsRoleSelections.get(key) ??
				getSavedSettingsRoles(interaction.guildId, client.settings);

			if (interaction.customId === 'settings:settings_roles:accept') {
				if (interaction.guildId) {
					const guildSettings = client.settings[interaction.guildId] ?? {};
					guildSettings.settingsRoleIds = selectedRoles;
					client.settings[interaction.guildId] = guildSettings;
					saveSettings(client);
				}

				pendingSettingsRoleSelections.delete(key);
				await interaction.update({
					content: `Settings roles saved: ${
						selectedRoles.length > 0
							? selectedRoles.map((roleId) => `<@&${roleId}>`).join(', ')
							: 'admins only'
					}.`,
					embeds: [],
					components: [],
				});
				return;
			}

			return;
		}

		// Handle Slash Commands
		if (!interaction.isChatInputCommand()) return;
		const command = interaction.client.commands.get(interaction.commandName);
		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}
		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({
					content: 'There was an error while executing this command!',
					flags: MessageFlags.Ephemeral,
				});
			} else {
				await interaction.reply({
					content: 'There was an error while executing this command!',
					flags: MessageFlags.Ephemeral,
				});
			}
		}
	});
};
