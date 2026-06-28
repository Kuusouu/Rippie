import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelSelectMenuBuilder,
	ChannelType,
	Client,
	Collection,
	EmbedBuilder,
	Events,
	GatewayIntentBits,
	MessageFlags,
	StringSelectMenuBuilder,
} from 'discord.js';
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

type ServiceConfig = {
	emoji: string;
};

type BotConfig = {
	services?: Record<string, ServiceConfig>;
};

type GuildSettings = {
	musicChannelId?: string;
	services?: Record<string, boolean>;
};

type SettingsStore = Record<string, GuildSettings>;

const client = new Client({
	intents: [GatewayIntentBits.Guilds],
});

const commandFileExtensions = ['.js', '.ts'];
const configPath = path.join(__dirname, '../config.json');
const settingsPath = path.join(__dirname, '../settings.json');

const loadBotConfig = (): BotConfig => {
	if (!fs.existsSync(configPath)) {
		return {};
	}

	try {
		return JSON.parse(fs.readFileSync(configPath, 'utf8')) as BotConfig;
	} catch (error) {
		console.error(
			'Failed to load config.json, continuing without services.',
			error,
		);
		return {};
	}
};

const botConfig = loadBotConfig();
const serviceEntries = Object.entries(botConfig.services ?? {}).map(
	([name, service]) => ({
		name,
		emoji: service.emoji,
	}),
);

const loadSettings = (): SettingsStore => {
	if (!fs.existsSync(settingsPath)) {
		return {};
	}

	try {
		return JSON.parse(
			fs.readFileSync(settingsPath, 'utf8'),
		) as SettingsStore;
	} catch (error) {
		console.error(
			'Failed to load settings.json, starting with an empty store.',
			error,
		);
		return {};
	}
};

const saveSettings = (): void => {
	fs.writeFileSync(
		settingsPath,
		`${JSON.stringify(client.settings, null, 2)}\n`,
	);
};

const getSelectionKey = (guildId: string | null, userId: string): string =>
	`${guildId ?? 'dm'}:${userId}`;

const pendingMusicServicesSelections = new Map<string, string[]>();

const getSavedMusicServices = (guildId: string | null): string[] => {
	if (!guildId) {
		return [];
	}

	const guildSettings = client.settings[guildId];
	if (!guildSettings?.services) {
		return [];
	}

	return serviceEntries
		.filter(({ name }) => guildSettings.services?.[name])
		.map(({ name }) => name);
};

const buildMusicServicesPayload = (selectedServices: string[]) => {
	const selectedSummary =
		selectedServices.length > 0
			? selectedServices.map((name) => `• ${name}`).join('\n')
			: 'Nothing selected yet.';

	const embed = new EmbedBuilder()
		.setColor(0x00ff00)
		.setTitle('Configure Music Services')
		.setDescription(
			'Select the services this community wants, then accept or decline the changes.',
		)
		.addFields({
			name: 'Current selection',
			value: selectedSummary,
			inline: false,
		});

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

	const selectRow =
		new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
			selectMenu,
		);

	const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId('settings:music_services:accept')
			.setLabel('Accept')
			.setStyle(ButtonStyle.Success),
		new ButtonBuilder()
			.setCustomId('settings:music_services:decline')
			.setLabel('Decline')
			.setStyle(ButtonStyle.Danger),
	);

	return {
		embeds: [embed],
		components: [selectRow, actionRow],
	};
};

client.commands = new Collection();
client.settings = loadSettings();

client.once(Events.ClientReady, (readyClient: Client<true>) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);
for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs
		.readdirSync(commandsPath)
		.filter((file) =>
			commandFileExtensions.some((extension) => file.endsWith(extension)),
		);
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);

		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(
				`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
			);
		}
	}
}

client.on(Events.InteractionCreate, async (interaction) => {
	if (interaction.isChannelSelectMenu()) {
		if (interaction.customId !== 'settings:music_channel') return;

		const selectedChannelId = interaction.values[0];
		if (interaction.guildId) {
			client.settings[interaction.guildId] ??= {};
			client.settings[interaction.guildId].musicChannelId =
				selectedChannelId;
			saveSettings();
		}

		await interaction.reply({
			content: `Music channel set to <#${selectedChannelId}> and saved.`,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	if (interaction.isStringSelectMenu()) {
		if (interaction.customId === 'settings:music_services') {
			const key = getSelectionKey(
				interaction.guildId,
				interaction.user.id,
			);
			pendingMusicServicesSelections.set(key, interaction.values);

			await interaction.update({
				...buildMusicServicesPayload(interaction.values),
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
				content:
					'Choose the public channel where music should be posted.',
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
			const key = getSelectionKey(
				interaction.guildId,
				interaction.user.id,
			);
			const selectedServices = getSavedMusicServices(interaction.guildId);
			pendingMusicServicesSelections.set(key, selectedServices);

			await interaction.reply({
				...buildMusicServicesPayload(selectedServices),
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		return;
	}

	if (interaction.isButton()) {
		if (!interaction.customId.startsWith('settings:music_services:'))
			return;

		const key = getSelectionKey(interaction.guildId, interaction.user.id);
		const selectedServices =
			pendingMusicServicesSelections.get(key) ??
			getSavedMusicServices(interaction.guildId);

		if (interaction.customId === 'settings:music_services:decline') {
			pendingMusicServicesSelections.delete(key);
			await interaction.update({
				content: 'Music services configuration cancelled.',
				embeds: [],
				components: [],
			});
			return;
		}

		if (interaction.customId === 'settings:music_services:accept') {
			if (interaction.guildId) {
				client.settings[interaction.guildId] ??= {};
				client.settings[interaction.guildId].services =
					Object.fromEntries(
						serviceEntries.map(({ name }) => [
							name,
							selectedServices.includes(name),
						]),
					);
				saveSettings();
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

	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);
	if (!command) {
		console.error(
			`No command matching ${interaction.commandName} was found.`,
		);
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

client.login(process.env.TOKEN);
