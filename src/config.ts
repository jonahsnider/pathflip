import * as fs from 'node:fs';
import * as path from 'node:path';
import { loadFromPath } from './generated/pathflip_config.pkl.js';

export type Config = {
	fieldHeight: number;
	replacements: Record<string, string>;
	negateConstants: string[];
};

const CONFIG_FILENAME = 'pathflip.config.pkl';

/** Walk up directories from `startDir` looking for `pathflip.config.pkl`. */
function discoverConfigPath(startDir: string): string | undefined {
	let dir = path.resolve(startDir);

	while (true) {
		const candidate = path.join(dir, CONFIG_FILENAME);

		if (fs.existsSync(candidate)) {
			return candidate;
		}

		const parent = path.dirname(dir);

		if (parent === dir) {
			return undefined;
		}

		dir = parent;
	}
}

export async function loadConfig(explicitPath: string | undefined, inputFile: string): Promise<Config> {
	const configPath = explicitPath ?? discoverConfigPath(path.dirname(path.resolve(inputFile)));

	if (!configPath) {
		throw new Error(
			`Could not find ${CONFIG_FILENAME} in any parent directory of ${inputFile}. Use --config to specify a path.`,
		);
	}

	const raw = await loadFromPath(path.resolve(configPath));

	const replacements =
		raw.replacements instanceof Map
			? raw.replacements
			: (raw.replacements as unknown as { entries: Map<string, string> }).entries;

	return {
		fieldHeight: raw.fieldHeight,
		replacements: Object.fromEntries(replacements),
		negateConstants: raw.negateConstants,
	};
}
