import fs from 'node:fs/promises';
import path from 'node:path';
import type { PathPlannerPath } from '../../../common/path-planner/types.js';
import type { PathPlannerProjectFilesPaths } from '../2/path-planner.js';

async function pathFilePathToPathName(pathFilePath: string): Promise<PathPlannerPathNames> {
	const loadedPath = JSON.parse(await fs.readFile(pathFilePath, 'utf-8')) as PathPlannerPath;

	const pathName = path.basename(pathFilePath, '.path');

	return {
		dir: loadedPath.folder ?? undefined,
		pathName,
		fullName: `${loadedPath.folder ?? ''}/${pathName}`,
	};
}

export type PathPlannerPathNames = {
	dir?: string;
	pathName: string;
	fullName: string;
};

export async function createPathNameLookup(
	projectFiles: Pick<PathPlannerProjectFilesPaths, 'pathFilePaths'>,
): Promise<Map<string, PathPlannerPathNames>> {
	const pathNameLookup = new Map<string, PathPlannerPathNames>();

	await Promise.all(
		projectFiles.pathFilePaths.map(async (pathFilePath) => {
			const pathName = await pathFilePathToPathName(pathFilePath);

			pathNameLookup.set(pathFilePath, pathName);
		}),
	);

	return pathNameLookup;
}
