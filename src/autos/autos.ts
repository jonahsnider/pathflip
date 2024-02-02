import { Dirent } from 'fs';
import fs from 'node:fs/promises';
import { join } from 'path';
import { settled } from '@jonahsnider/util';
import { pathExists } from 'path-exists';
import { PathEntry, getPathEntryFromName } from '../paths/paths.js';
import { Auto, AutoCommandEntry, parseAutoFromFile } from './auto.js';

export type AutoEntry = {
	filepath: string;
	dir: string | undefined;
	name: string;
	nameWithDir: string;
	parsed: Auto;
	paths: PathEntry[];
};

async function getAutosDirEntries(projectDir: string): Promise<{ path: string; dirents: Dirent[] } | undefined> {
	const searchDirs = [
		join(projectDir, 'src', 'main', 'deploy', 'pathplanner', 'autos'),
		join(projectDir, 'deploy', 'pathplanner', 'autos'),
	];

	for (const searchDir of searchDirs) {
		const [autosDirEntries, readdirError] = await settled<Error, Dirent[]>(
			fs.readdir(searchDir, { withFileTypes: true }),
		);

		if (readdirError) {
			// @ts-expect-error This is a custom error code
			if (readdirError.code === 'ENOENT') {
				continue;
			}

			throw readdirError;
		}

		return { path: searchDir, dirents: autosDirEntries };
	}

	return undefined;
}

function createAutoCommandGuard<T extends AutoCommandEntry['type']>(
	type: T,
): (entry: AutoCommandEntry) => entry is typeof entry & { type: T } {
	return (entry): entry is typeof entry & { type: T } => entry.type === type;
}

export async function listAutos(projectDir: string): Promise<AutoEntry[] | undefined> {
	const autosDirEntries = await getAutosDirEntries(projectDir);

	if (!autosDirEntries) {
		return undefined;
	}

	const autos: AutoEntry[] = [];

	for (const file of autosDirEntries.dirents) {
		if (!(file.isFile() && file.name.endsWith('.auto'))) {
			continue;
		}

		const filepath = join(autosDirEntries.path, file.name);
		const parsed = await parseAutoFromFile(filepath);
		const autoName = file.name.slice(0, -'.auto'.length);

		const paths: PathEntry[] = await Promise.all(
			parsed.command.data.commands
				.filter(createAutoCommandGuard('path'))
				.map(async (command) => getPathEntryFromName(projectDir, command.data.pathName)),
		);

		autos.push({
			filepath,
			dir: parsed.folder ?? undefined,
			name: autoName,
			nameWithDir: parsed.folder ? `${parsed.folder}/${autoName}` : autoName,
			parsed,
			paths,
		});
	}

	return autos;
}

export async function getExistingAutos(transformed: AutoEntry[]) {
	return (await Promise.all(transformed.map(async (auto) => [auto, await pathExists(auto.filepath)] as const)))
		.filter(([, exists]) => exists)
		.map(([auto]) => auto);
}
