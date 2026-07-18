// Credits to the discord.js Get Started Guide

import fs from 'node:fs';
import path from 'node:path';
import { REST, Routes } from 'discord.js';
import { env } from './env';

const commands: unknown[] = [];
const commandFileExtensions = ['.js', '.ts'];

const rest = new REST().setToken(env.TOKEN);
const guildIds = env.GUILDS;

(async () => {
	try {
		const foldersPath = path.join(import.meta.dir, 'commands');
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
			const data = (await rest.put(Routes.applicationGuildCommands(env.CLIENTID, guildId), {
				body: commands,
			})) as unknown[];

			console.log(
				`Successfully reloaded ${data.length} application (/) commands for guild ${guildId}.`,
			);
		}
	} catch (error) {
		console.error(error);
	}
})();
