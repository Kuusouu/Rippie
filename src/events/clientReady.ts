import { type Client, Events } from 'discord.js';

export const registerClientReadyHandler = (client: Client): void => {
	client.once(Events.ClientReady, (readyClient: Client<true>) => {
		console.log(`Ready! Logged in as ${readyClient.user.tag}`);
	});
};
