import * as path from 'node:path';
import { getExePath } from '@pkl-community/pkl';
import * as pklTypescript from '@pkl-community/pkl-typescript';
import { findUp } from 'find-up';
import { load } from './generated/pathflip_config.pkl.js';

export type Config = {
	fieldHeight: number;
	replacements: Record<string, string>;
	negateConstants: string[];
};

const CONFIG_FILENAME = 'pathflip.config.pkl';

export async function loadConfig(explicitPath: string | undefined, inputFile: string): Promise<Config> {
	const configPath = explicitPath ?? (await findUp(CONFIG_FILENAME, { cwd: path.dirname(path.resolve(inputFile)) }));

	if (!configPath) {
		throw new Error(
			`Could not find ${CONFIG_FILENAME} in any parent directory of ${inputFile}. Use --config to specify a path.`,
		);
	}

	const evaluator = await pklTypescript.newEvaluatorWithCommand([getExePath()], pklTypescript.PreconfiguredOptions);
	try {
		const raw = await load(evaluator, pklTypescript.FileSource(path.resolve(configPath)));

		const replacements =
			raw.replacements instanceof Map
				? raw.replacements
				: (raw.replacements as unknown as { entries: Map<string, string> }).entries;

		return {
			fieldHeight: raw.fieldHeight,
			replacements: Object.fromEntries(replacements),
			negateConstants: raw.negateConstants,
		};
	} finally {
		evaluator.close();
	}
}
