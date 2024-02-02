import { AutoEntry } from '../autos/autos.js';
import { Settings } from '../settings/settings.js';

export function transformSettings(settings: Settings, transformedAutos: AutoEntry[]): Settings | undefined {
	const output = structuredClone(settings);

	const autoFolders = new Set(output.autoFolders);
	const pathFolders = new Set(output.pathFolders);

	for (const auto of transformedAutos) {
		if (auto.parsed.folder) {
			autoFolders.add(auto.parsed.folder);
		}

		for (const path of auto.paths) {
			if (path.parsed.folder) {
				pathFolders.add(path.parsed.folder);
			}
		}
	}

	if (autoFolders.size === output.autoFolders.length && pathFolders.size === output.pathFolders.length) {
		return undefined;
	}

	output.autoFolders = Array.from(autoFolders);
	output.pathFolders = Array.from(pathFolders);

	return output;
}
