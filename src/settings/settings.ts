import fs from 'node:fs/promises';
import { join } from 'node:path';

export type Settings = {
	robotWidth: number;
	robotLength: number;
	holonomicMode: true;
	pathFolders: string[];
	autoFolders: string[];
	defaultMaxVel: number;
	defaultMaxAccel: number;
	defaultMaxAngVel: number;
	defaultMaxAngAccel: number;
	maxModuleSpeed: number;
};

export type SettingsEntry = {
	filepath: string;
	parsed: Settings;
};

export async function parseSettings(projectDir: string): Promise<Settings> {
	const file = await fs.readFile(join(projectDir, 'src', 'main', 'deploy', 'pathplanner', 'settings.json'), 'utf-8');

	return JSON.parse(file) as Settings;
}
