import { groupMultiselect, isCancel } from '@clack/prompts';

import { DefaultMap } from '@jonahsnider/util';
import { AutoEntry } from '../../autos/autos.js';
import { GroupMultiSelectOption, GroupMultiSelectOptions } from '../clack-utils.js';

function generateOptionsForAutos(autos: AutoEntry[]): GroupMultiSelectOptions<AutoEntry> {
	const options = new DefaultMap<string, GroupMultiSelectOption<AutoEntry>>(() => []);

	for (const entry of autos) {
		const dirKey = `${entry.dir ?? ''}/`;
		const option = options.get(dirKey);

		option.push({
			value: entry,
			label: entry.name,
		});

		options.set(dirKey, option);
	}
	const resultEntries = [...options.entries()];

	resultEntries.sort(([a], [b]) => a.localeCompare(b));

	return Object.fromEntries(resultEntries);
}

export async function selectAutos(
	autoEntries: AutoEntry[],
	initialSelection: AutoEntry[] = [],
): Promise<AutoEntry[] | undefined> {
	const options = generateOptionsForAutos(autoEntries);

	const autos = await groupMultiselect({
		message: 'What autos would you like to transform?',
		options,
		required: true,
		initialValues: initialSelection,
	});

	if (isCancel(autos)) {
		return undefined;
	}

	return autos;
}
