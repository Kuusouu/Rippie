import { Client, Collection, GatewayIntentBits } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { env } from './env';

import { loadBotConfig, loadSettings } from './config';
import { registerClientReadyHandler } from './events/clientReady';
import { registerInteractionCreateHandler } from './events/interactionCreate';
import { registerMessageHandler } from './events/messageCreate';

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
});

const commandFileExtensions = ['.js', '.ts'];

client.commands = new Collection();
client.settings = loadSettings();
client.config = loadBotConfig();

// Register Event Handlers
registerClientReadyHandler(client);
registerMessageHandler(client);
registerInteractionCreateHandler(client);

// Load Slash Commands
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);
for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs
		.readdirSync(commandsPath)
		.filter((file) => commandFileExtensions.some((extension) => file.endsWith(extension)));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = (await import(filePath)).default;

		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(
				`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
			);
		}
	}
}

client.login(env.TOKEN);
