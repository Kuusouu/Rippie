import { Collection, PermissionsBitField } from 'discord.js';
import type { SettingsStore } from './types';

export const getMemberRoleIds = (
	member:
		| { roles: string[] }
		| { roles: { cache: Collection<string, unknown> } }
		| null
		| undefined,
): string[] => {
	if (!member) {
		return [];
	}

	if (Array.isArray(member.roles)) {
		return member.roles;
	}

	return [...member.roles.cache.keys()];
};

export const getSavedSettingsRoles = (
	guildId: string | null,
	settings: SettingsStore,
): string[] => {
	if (!guildId) {
		return [];
	}

	return settings[guildId]?.settingsRoleIds ?? [];
};

export const hasSettingsAccess = (
	interaction:
		| {
				guildId: string | null;
				memberPermissions: PermissionsBitField | null;
				member:
					| { roles: string[] }
					| { roles: { cache: Collection<string, unknown> } }
					| null
					| undefined;
		  }
		| {
				guildId: string | null;
				memberPermissions?: PermissionsBitField | null;
				member?: unknown;
		  },
	allowedRoles: string[],
): boolean => {
	if (!interaction.guildId) {
		return false;
	}

	if (allowedRoles.length === 0) {
		return (
			interaction.memberPermissions?.has(
				PermissionsBitField.Flags.Administrator,
			) ?? false
		);
	}

	const memberRoleIds = getMemberRoleIds(
		interaction.member as
			| { roles: string[] }
			| { roles: { cache: Collection<string, unknown> } }
			| null
			| undefined,
	);

	return allowedRoles.some((roleId) => memberRoleIds.includes(roleId));
};
