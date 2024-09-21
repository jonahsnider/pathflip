import { loadChoreoSettings } from '../../../common/choreo/fs.js';
import type { ChoreoProjectFilesPaths } from '../2/choreo.js';

async function getChoreoPathNames(choreoSettingsFilePath: string): Promise<string[]> {
	const loadedSettings = await loadChoreoSettings(choreoSettingsFilePath);

	return Object.keys(loadedSettings.paths);
}

export async function getAllChoreoPathNames(projectFiles: ChoreoProjectFilesPaths): Promise<Map<string, string[]>> {
	return new Map(
		await Promise.all(
			projectFiles.settingsFilePaths.map(async (choreoSettingsFilePath) => {
				const pathNames = await getChoreoPathNames(choreoSettingsFilePath);
				return [choreoSettingsFilePath, pathNames] as const;
			}),
		),
	);
}
