import { groupMultiselect, isCancel } from '@clack/prompts';
import { DefaultMap } from '@jonahsnider/util';

import { AutoEntry } from '../../autos/autos.js';
import { AutoWithTransforms, getAllowedTransforms } from '../../transforms/auto-transforms.js';
import { GroupMultiSelectOption, GroupMultiSelectOptions } from '../clack-utils.js';

function getTransformsOptions(auto: AutoEntry): GroupMultiSelectOption<AutoWithTransforms> {
	const allowedTransforms = getAllowedTransforms(auto);

	return allowedTransforms.map((transform) => {
		if (transform.color) {
			return {
				value: {
					auto,
					transform,
				},
				label: transform.color === 'red2blue' ? 'Red to blue' : 'Blue to red',
			};
		}

		return {
			value: {
				auto,
				transform,
			},
			label: transform.vertical === 'top2bottom' ? 'Top to bottom' : 'Bottom to top',
		};
	});
}

export async function selectTransforms(autos: readonly AutoEntry[]): Promise<AutoWithTransforms[] | undefined> {
	const optionsEntries = autos.map((auto) => [auto.nameWithDir, getTransformsOptions(auto)] as const);

	optionsEntries.sort(([a], [b]) => a.localeCompare(b));

	const options: GroupMultiSelectOptions<AutoWithTransforms> = Object.fromEntries(optionsEntries);

	const _rawSelections = await groupMultiselect({
		message: `Which transforms should be applied to the ${autos.length === 1 ? 'auto' : 'autos'}?`,
		options,
		required: true,
	});

	if (isCancel(_rawSelections)) {
		return undefined;
	}

	const rawSelections = _rawSelections as AutoWithTransforms[];

	const selections = new DefaultMap<AutoEntry, AutoWithTransforms>(
		(auto): AutoWithTransforms => ({
			auto,
			transform: {
				color: undefined,
				vertical: undefined,
			},
		}),
	);

	for (const selection of rawSelections) {
		const existing = selections.get(selection.auto);

		if (selection.transform.color) {
			existing.transform.color = selection.transform.color;
		}

		if (selection.transform.vertical) {
			existing.transform.vertical = selection.transform.vertical;
		}

		selections.set(selection.auto, existing);
	}

	return [...selections.values()];
}
