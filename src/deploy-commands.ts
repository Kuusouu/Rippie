// Credits to the discord.js Get Started Guide

import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { env } from './env';

const commands: unknown[] = [];
const commandFileExtensions = ['.js', '.ts'];

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(env.TOKEN);
const guildIds = env.GUILDS;

// and deploy your commands!
(async () => {
	try {
		// Grab all the command folders from the commands directory
		const foldersPath = path.join(import.meta.dir, 'commands');
		const commandFolders = fs.readdirSync(foldersPath);

		for (const folder of commandFolders) {
			// Grab all the command files from the commands directory
			const commandsPath = path.join(foldersPath, folder);
			const commandFiles = fs
				.readdirSync(commandsPath)
				.filter((file) =>
					commandFileExtensions.some((extension) =>
						file.endsWith(extension),
					),
				);

			// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
			for (const file of commandFiles) {
				const filePath = path.join(commandsPath, file);
				const commandModule = await import(filePath);
				const command = commandModule.default;
				if (command && 'data' in command && 'execute' in command) {
					commands.push(command.data.toJSON());
				} else {
					console.log(
						`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
					);
				}
			}
		}

		if (guildIds.length === 0) {
			throw new Error('No guild IDs found in GUILDS.');
		}

		console.log(
			`Started refreshing ${commands.length} application (/) commands for ${guildIds.length} guilds.`,
		);

		for (const guildId of guildIds) {
			// The put method is used to fully refresh all commands in each guild with the current set
			const data = (await rest.put(
				Routes.applicationGuildCommands(env.CLIENTID, guildId),
				{ body: commands },
			)) as unknown[];

			console.log(
				`Successfully reloaded ${data.length} application (/) commands for guild ${guildId}.`,
			);
		}
	} catch (error) {
		console.error(error);
	}
})();
