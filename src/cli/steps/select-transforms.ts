import { groupMultiselect, isCancel, multiselect, select } from '@clack/prompts';
import { PathEntryFile } from '../../paths/paths.js';
import { GroupMultiSelectOption, GroupMultiSelectOptions } from '../clack-utils.js';
import { DefaultMap } from '@jonahsnider/util';
import { FIELD_HEIGHT, FIELD_LENGTH } from '../../constants.js';

type ColorTransform = 'red2blue' | 'blue2red';
type VerticalTransform = 'top2bottom' | 'bottom2top';

export type TransformRequest = {
	color: ColorTransform | undefined;
	vertical: VerticalTransform | undefined;
};

export type PathWithTransforms = {
	path: PathEntryFile;
	transform: TransformRequest;
};

function possiblePathTransforms(path: PathEntryFile): GroupMultiSelectOption<PathWithTransforms> {
	const [firstPoint] = path.parsed.waypoints;

	if (!firstPoint) {
		return [];
	}

	const { anchor } = firstPoint;

	const result: GroupMultiSelectOption<PathWithTransforms> = [];

	if (anchor.x > FIELD_LENGTH / 2) {
		result.push({
			value: {
				path,
				transform: {
					color: 'red2blue',
					vertical: undefined,
				},
			},
			label: 'Red to blue',
		});
	} else {
		result.push({
			value: {
				path,
				transform: {
					color: 'blue2red',
					vertical: undefined,
				},
			},
			label: 'Blue to red',
		});
	}

	if (anchor.y > FIELD_HEIGHT / 2) {
		result.push({
			value: {
				path,
				transform: {
					color: undefined,
					vertical: 'top2bottom',
				},
			},
			label: 'Top to bottom',
		});
	} else {
		result.push({
			value: {
				path,
				transform: {
					color: undefined,
					vertical: 'bottom2top',
				},
			},
			label: 'Bottom to top',
		});
	}

	return result;
}

export async function selectTransforms(paths: readonly PathEntryFile[]): Promise<PathWithTransforms[] | undefined> {
	const optionsEntries = paths.map((path) => [path.nameWithDir, possiblePathTransforms(path)] as const);

	optionsEntries.sort(([a], [b]) => a.localeCompare(b));

	const options: GroupMultiSelectOptions<PathWithTransforms> = Object.fromEntries(optionsEntries);

	const _rawSelections = await groupMultiselect({
		message: 'Select what transforms to apply to each path',
		options,
		required: true,
	});

	if (isCancel(_rawSelections)) {
		return undefined;
	}

	const rawSelections = _rawSelections as PathWithTransforms[];

	const selections = new DefaultMap<PathEntryFile, PathWithTransforms>(
		(path): PathWithTransforms => ({
			path,
			transform: {
				color: undefined,
				vertical: undefined,
			},
		}),
	);

	for (const selection of rawSelections) {
		const existing = selections.get(selection.path);

		if (selection.transform.color) {
			existing.transform.color = selection.transform.color;
		}

		if (selection.transform.vertical) {
			existing.transform.vertical = selection.transform.vertical;
		}

		selections.set(selection.path, existing);
	}

	return [...selections.values()];
}
