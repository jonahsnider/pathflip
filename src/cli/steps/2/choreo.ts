import fs from 'node:fs/promises';
import path from 'node:path';

export type ChoreoProjectFilesPaths = {
	settingsFilePaths: string[];
};

export async function scanForChoreoProjectFiles(projectDir: string): Promise<ChoreoProjectFilesPaths> {
	const dirEntries = await fs.readdir(projectDir, { withFileTypes: true });

	return {
		settingsFilePaths: dirEntries
			.filter((entry) => entry.isFile() && entry.name.endsWith('.chor'))
			.map((entry) => path.join(projectDir, entry.name)),
	};
}
