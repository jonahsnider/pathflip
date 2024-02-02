import { confirm, isCancel, log } from '@clack/prompts';
import { AutoEntry } from '../../autos/autos.js';
import { PathEntry } from '../../paths/paths.js';
import { S_BAR, S_BAR_END } from '../constants.js';
import { treePrefix } from '../formatting.js';

function formatExistingPaths(existingPaths: Map<AutoEntry, PathEntry[]>) {
	return [...existingPaths.entries()]
		.filter(([, paths]) => paths.length > 0)
		.map(([auto, paths], autoIndex) =>
			[
				`${autoIndex + 1 === existingPaths.size ? S_BAR_END : S_BAR} ${auto.nameWithDir}`,
				...paths.map(
					(path, pathIndex) =>
						`${autoIndex + 1 === existingPaths.size ? ' ' : S_BAR} ${
							pathIndex + 1 === paths.length ? S_BAR_END : S_BAR
						} ${path.name}`,
				),
			].join('\n'),
		);
}

function formatExistingAutos(existingAutos: AutoEntry[]) {
	return existingAutos.map((auto) => auto.nameWithDir).map(treePrefix);
}

export async function confirmOverwrite(
	allInputAutos: AutoEntry[],
	existingAutos: AutoEntry[],
	existingPaths: Map<AutoEntry, PathEntry[]>,
): Promise<undefined | boolean> {
	const existingAutoNames = formatExistingAutos(existingAutos);
	const existingPathNames = formatExistingPaths(existingPaths);

	if (existingAutoNames.length > 0) {
		log.warn(
			[
				allInputAutos.length === 1 ? 'That auto already exists:' : 'The following autos already exist:',
				...existingAutoNames,
			].join('\n'),
		);

		if (existingPathNames.length > 0) {
			log.warn(
				[
					allInputAutos.length === 1
						? 'And the following paths referenced in the auto also already exist:'
						: 'And the following paths referenced in some autos also already exist:',
					...existingPathNames,
				].join('\n'),
			);
		}
	} else {
		log.warn(
			[
				allInputAutos.length === 1
					? 'The following paths referenced in the auto also already exist:'
					: 'The following paths referenced in some autos also already exist:',
				...existingPathNames,
			].join('\n'),
		);
	}

	const shouldOverwrite = await confirm({
		message: 'Is it okay to overwrite those?',
		initialValue: false,
	});

	if (isCancel(shouldOverwrite)) {
		return undefined;
	}

	if (!shouldOverwrite) {
		return false;
	}

	return true;
}
