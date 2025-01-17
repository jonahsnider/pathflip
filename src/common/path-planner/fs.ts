import fs from 'node:fs/promises';
import path from 'node:path';
import { log } from '@clack/prompts';
import type { PathPlannerPath, PathPlannerSettings } from './types.js';

export async function loadPathPlannerSettings(projectDir: string): Promise<PathPlannerSettings> {
	const file = await fs.readFile(
		path.join(projectDir, 'src', 'main', 'deploy', 'pathplanner', 'settings.json'),
		'utf-8',
	);

	return JSON.parse(file) as PathPlannerSettings;
}

export async function writePathPlannerSettings(projectDir: string, settings: PathPlannerSettings): Promise<void> {
	const serialized = JSON.stringify(settings, null, 2)
		// Workaround for https://github.com/mjansen4857/pathplanner/issues/588
		.replaceAll(/\s\d+,$/gm, (value) => ` ${value.slice(' '.length, -','.length)}.0,`);

	await fs.writeFile(path.join(projectDir, 'src', 'main', 'deploy', 'pathplanner', 'settings.json'), serialized);
}

export async function loadPathPlannerPath(pathFilePath: string): Promise<PathPlannerPath> {
	const file = await fs.readFile(pathFilePath, 'utf-8');

	const parsed = JSON.parse(file) as PathPlannerPath;

	if (parsed.version !== '2025.0') {
		log.warn(`PathPlanner path ${pathFilePath} has an unsupported version: ${parsed.version}`);
	}

	return parsed;
}

export async function writePathPlannerPath(pathFilePath: string, path: PathPlannerPath): Promise<void> {
	await fs.writeFile(pathFilePath, JSON.stringify(path, null, 2));
}
