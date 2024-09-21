import fs from 'node:fs/promises';
import { log } from '@clack/prompts';
import type { ChoreoSettings } from './types.js';

export async function loadChoreoSettings(filePath: string): Promise<ChoreoSettings> {
	const file = await fs.readFile(filePath, 'utf-8');

	const parsed = JSON.parse(file) as ChoreoSettings;

	if (parsed.version !== 'v0.4') {
		log.warn(`Choreo settings file ${filePath} has an unsupported version: ${parsed.version}`);
	}

	return parsed;
}

export async function writeChoreoSettings(filePath: string, settings: ChoreoSettings): Promise<void> {
	await fs.writeFile(filePath, JSON.stringify(settings, null, 4));
}
