import fs from 'node:fs/promises';
import path from 'node:path';
import { pathExists } from 'path-exists';

export type PathPlannerProjectFilesPaths = {
	settingsFilePath: string;
	pathFilePaths: string[];
};

/** Scans the given project dir for PathPlanner files. */
export async function scanForPathPlannerProjectFiles(
	projectDir: string,
): Promise<PathPlannerProjectFilesPaths | undefined> {
	const maybeSettingsPath = path.join(projectDir, '.pathplanner', 'settings.json');

	// If the settings file isn't there, we can skip looking for paths
	if (!(await pathExists(maybeSettingsPath))) {
		return undefined;
	}

	const result: PathPlannerProjectFilesPaths = {
		settingsFilePath: maybeSettingsPath,
		pathFilePaths: [],
	};

	const pathSearchDirs = [
		// Java and C++ projects
		path.join(projectDir, 'src', 'main', 'deploy', 'pathplanner', 'paths'),
		// Python projects
		path.join(projectDir, 'deploy', 'pathplanner', 'paths'),
	];

	for (const searchDir of pathSearchDirs) {
		try {
			const dirEntries = await fs.readdir(searchDir, { withFileTypes: true });

			const pathFilePaths = await Promise.all(
				dirEntries
					.filter((entry) => entry.isFile() && entry.name.endsWith('.path'))
					.map((entry) => path.join(searchDir, entry.name)),
			);

			result.pathFilePaths.push(...pathFilePaths);
		} catch (error) {
			// @ts-expect-error This is a custom error code
			if (error.code === 'ENOENT') {
				continue;
			}

			throw error;
		}
	}

	return result;
}
