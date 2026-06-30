import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
	TOKEN: z.string().min(1, 'TOKEN cannot be empty'),
	CLIENTID: z.string().min(1, 'CLIENTID cannot be empty'),
	GUILDS: z
		.string()
		.min(1, 'GUILDS cannot be empty')
		.transform((val) =>
			val
				.split(',')
				.map((guildId) => guildId.trim())
				.filter(Boolean),
		)
		.refine((guilds) => guilds.length > 0, 'GUILDS must contain at least one valid guild ID'),
});

export const env = envSchema.parse(process.env);
