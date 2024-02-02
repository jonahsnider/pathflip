import path from 'path';
import fs from 'fs/promises';
import { AutoEntry, getExistingAutos } from '../autos/autos.js';
import { PathEntry, getExistingPaths } from '../paths/paths.js';
import { parseSettings } from '../settings/settings.js';
import { AutoWithTransforms, transformAuto } from '../transforms/auto-transforms.js';
import { transformSettings } from './settings-transforms.js';

export async function transformAutos(transforms: AutoWithTransforms[]): Promise<{
	existingAutos: AutoEntry[];
	existingPaths: Map<AutoEntry, PathEntry[]>;
	output: AutoEntry[];
}> {
	const output = transforms.map((transform) => transformAuto(transform.auto, transform.transform));

	const existingAutos = await getExistingAutos(output);

	const existingPaths: Map<AutoEntry, PathEntry[]> = new Map(
		(await Promise.all(output.map(async (auto) => [auto, await getExistingPaths(auto.paths)] as const))).filter(
			([, paths]) => paths.length > 0,
		),
	);

	return {
		existingAutos,
		existingPaths,
		output,
	};
}

export async function transformSettingsAndFlush(projectDir: string, transformedAutos: AutoEntry[]): Promise<void> {
	const settings = await parseSettings(projectDir);
	const transformedSettings = transformSettings(settings, transformedAutos);

	if (transformedSettings) {
		const stringified = JSON.stringify(transformedSettings, null, 2);

		// Workaround for https://github.com/mjansen4857/pathplanner/issues/588
		const patched = stringified.replaceAll(/[^.]\d+,$/gm, (value) => ` ${value.slice(' '.length, -','.length)}.0,`);

		await fs.writeFile(path.join(projectDir, '.pathplanner', 'settings.json'), patched);
	}
}
