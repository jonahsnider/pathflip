import { basename } from 'path';
import { pathExists } from 'path-exists';
import { Path, parsePathFromFile, parsePathFromName } from './path.js';

export type PathEntry = {
	filepath: string;
	parsed: Path;
	nameWithDir: string;
	name: string;
};

export async function getPathEntryFromFile(filepath: string): Promise<PathEntry> {
	const path = await parsePathFromFile(filepath);
	const pathName = basename(filepath).slice(0, -'.path'.length);

	return {
		parsed: path,
		filepath: filepath,
		nameWithDir: path.folder ? `${path.folder}/${pathName}` : pathName,
		name: pathName,
	};
}

export async function getPathEntryFromName(projectDir: string, pathName: string): Promise<PathEntry> {
	const { parsed, filepath } = await parsePathFromName(projectDir, pathName);

	return {
		parsed,
		filepath,
		nameWithDir: parsed.folder ? `${parsed.folder}/${pathName}` : pathName,
		name: pathName,
	};
}

export async function getExistingPaths(paths: PathEntry[]): Promise<PathEntry[]> {
	return (await Promise.all(paths.map(async (path) => [path, await pathExists(path.filepath)] as const)))
		.filter(([, exists]) => exists)
		.map(([path]) => path);
}
