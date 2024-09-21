import assert from 'node:assert/strict';
import path from 'node:path';
import { cancel, groupMultiselect, isCancel } from '@clack/prompts';
import { choreoTransformer, pathPlannerTransformer } from '../../../transformers/transformers.js';
import type { GroupMultiSelectOption, GroupMultiSelectOptions } from '../../clack-utils.js';
import type { ChoreoPathSelection, PathSelection, SelectedPaths } from '../3/select-paths.js';

type ColorTransform = 'red2blue' | 'blue2red';
type VerticalTransform = 'top2bottom' | 'bottom2top';

export type TransformRequest = { color: ColorTransform | undefined; vertical: VerticalTransform | undefined };

export type TransformSelection = {
	path: PathSelection;
	request: TransformRequest;
};

export type ChoreoTransformSelection = TransformSelection & { path: { kind: 'choreo' } };
export type PathPlannerTransformSelection = TransformSelection & { path: { kind: 'path-planner' } };

export async function selectTransforms(paths: SelectedPaths): Promise<TransformSelection[]> {
	const possibleChoreoTransforms = await choreoTransformer.possibleTransforms(
		paths.choreoPaths
			.entries()
			.flatMap(([settingsFile, pathNames]) =>
				pathNames.map(
					(pathName): ChoreoPathSelection => ({
						kind: 'choreo',
						settingsFilePath: settingsFile,
						pathName,
					}),
				),
			)
			.toArray(),
	);
	const possiblePathPlannerTransforms = await pathPlannerTransformer.possibleTransforms(
		paths.pathPlannerPaths.selectedPathFilePaths.map((pathFilePath) => ({
			kind: 'path-planner',
			pathFilePath,
		})),
	);

	const allPossibleTransforms = [...possibleChoreoTransforms, ...possiblePathPlannerTransforms];

	if (allPossibleTransforms.length === 0) {
		cancel('No transforms are possible for the selected paths');
		process.exit(1);
	}

	const options = createTransformOptions(allPossibleTransforms, paths);

	const rawSelections = (await groupMultiselect({
		message: 'Which transforms should be applied to the paths?',
		options,
		required: true,
	})) as symbol | TransformSelection[];

	if (isCancel(rawSelections)) {
		cancel('Cancelled transform selection, no paths will be modified');
		process.exit(1);
	}

	// Raw selections need to be combined
	// For example, if the user selected "Red to blue" and "Top to bottom" for a path, that will be two entries in the raw selection array
	// We know there will never be conflicting selections (ex. "Red to blue" and "Blue to red"), so we can just take the non-undefined values in each raw selection
	const rawSelectionsGroupedByPath = Map.groupBy(rawSelections, (selection) =>
		getPathDisplayName(selection.path, paths),
	);

	return rawSelectionsGroupedByPath
		.values()
		.map((rawSelection): TransformSelection => {
			const [firstSelection] = rawSelection;

			assert(
				firstSelection !== undefined,
				new TypeError('An element was in the raw selections but had no sub-options selected'),
			);

			return rawSelection.reduce(
				(accumulator, current) => {
					if (current.request.color) {
						accumulator.request.color = current.request.color;
					}

					if (current.request.vertical) {
						accumulator.request.vertical = current.request.vertical;
					}

					return accumulator;
				},
				{
					path: firstSelection.path,
					request: {
						color: undefined,
						vertical: undefined,
					},
				},
			);
		})
		.toArray();
}

function getPathDisplayName(pathSelection: PathSelection, allPaths: SelectedPaths): string {
	if (pathSelection.kind === 'choreo') {
		return `${path.basename(pathSelection.settingsFilePath)} - ${pathSelection.pathName}`;
	}

	const pathPlannerPathName = allPaths.pathPlannerPaths.pathFileToPathName.get(pathSelection.pathFilePath);

	assert(pathPlannerPathName !== undefined, new TypeError(`Unknown PathPlanner path ${pathPlannerPathName}`));

	return `PathPlanner - ${pathPlannerPathName}`;
}

function createTransformOptions(
	selections: TransformSelection[],
	allSelectedPaths: SelectedPaths,
): GroupMultiSelectOptions<TransformSelection> {
	// Construct the selection options from the path names
	const options: GroupMultiSelectOptions<TransformSelection> = {};

	for (const selection of selections) {
		const optionsForPath: GroupMultiSelectOption<TransformSelection> = [];

		switch (selection.request.color) {
			case 'blue2red':
				optionsForPath.push({
					value: {
						path: selection.path,
						request: {
							color: 'blue2red',
							vertical: undefined,
						},
					},
					label: 'Blue to red',
				});
				break;
			case 'red2blue':
				optionsForPath.push({
					value: {
						path: selection.path,
						request: {
							color: 'red2blue',
							vertical: undefined,
						},
					},
					label: 'Red to blue',
				});
				break;
		}

		switch (selection.request.vertical) {
			case 'bottom2top':
				optionsForPath.push({
					value: {
						path: selection.path,
						request: {
							color: undefined,
							vertical: 'bottom2top',
						},
					},
					label: 'Bottom to top',
				});
				break;
			case 'top2bottom':
				optionsForPath.push({
					value: {
						path: selection.path,
						request: {
							color: undefined,
							vertical: 'top2bottom',
						},
					},
					label: 'Top to bottom',
				});
				break;
		}

		options[getPathDisplayName(selection.path, allSelectedPaths)] = optionsForPath;
	}

	return options;
}
