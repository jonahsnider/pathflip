import { groupMultiselect, isCancel } from '@clack/prompts';

import {
	AnyPathEntry,
	FlattenedPathTree,
	PathEntryFile,
	PathEntryKind,
	createPathEntryGuard,
} from '../../paths/paths.js';
import { GroupMultiSelectOption, GroupMultiSelectOptions } from '../clack-utils.js';
import { DefaultMap } from '@jonahsnider/util';

function generateOptionsForPaths(flattened: FlattenedPathTree): GroupMultiSelectOptions<AnyPathEntry> {
	const options = new DefaultMap<string, GroupMultiSelectOption<AnyPathEntry>>(() => []);

	for (const entry of flattened) {
		if (entry.kind === PathEntryKind.File) {
			const dirKey = `${entry.dir ?? ''}/`;
			const option = options.get(dirKey);

			option.push({
				value: entry,
				label: entry.name,
			});

			options.set(dirKey, option);
		}
	}
	const resultEntries = [...options.entries()];

	resultEntries.sort(([a], [b]) => a.localeCompare(b));

	return Object.fromEntries(resultEntries);
}

export async function selectPaths(
	flattened: FlattenedPathTree,
	initialSelection: FlattenedPathTree = [],
): Promise<PathEntryFile[] | undefined> {
	const options = generateOptionsForPaths(flattened);

	const paths = await groupMultiselect({
		message: 'What paths would you like to transform?',
		// @ts-expect-error Not sure why the types are messed up here
		options,
		required: true,
		initialValues: initialSelection,
	});

	if (isCancel(paths)) {
		return undefined;
	}

	return paths.filter(createPathEntryGuard(PathEntryKind.File));
}
