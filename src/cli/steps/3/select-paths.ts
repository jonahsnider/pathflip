import path from 'node:path';
import { cancel, groupMultiselect, isCancel } from '@clack/prompts';
import { DefaultMap, partition } from '@jonahsnider/util';
import type { GroupMultiSelectOptions } from '../../clack-utils.js';
import type { ProjectFilesScanResult } from '../2/scan-for-project-files.js';
import { getAllChoreoPathNames } from './choreo.js';
import { createPathNameLookup, type PathPlannerPathNames } from './path-planner.js';

export type SelectedPaths = {
	/** Maps path file name to path name. */
	pathPlannerPaths: {
		selectedPathFilePaths: string[];
		pathFileToPathName: Map<string, string>;
	};
	/** Maps Choreo settings file name to list of path names. */
	choreoPaths: Map<string, string[]>;
};

export type ChoreoPathSelection = {
	kind: 'choreo';
	settingsFilePath: string;
	pathName: string;
};

export type PathPlannerPathSelection = {
	kind: 'path-planner';
	pathFilePath: string;
};

export type PathSelection = ChoreoPathSelection | PathPlannerPathSelection;

/**
 * Given the result of a project file scan, do the minimal parsing/loading necessary to provide a list of paths to transform.
 * Transform selection will happen in the next step.
 */
export async function selectPaths(projectFiles: ProjectFilesScanResult): Promise<SelectedPaths> {
	// Load the names of the paths, to show to the user
	const [pathPlannerPathFileToPathName, allChoreoPathNames] = await Promise.all([
		projectFiles.pathPlannerPaths ? createPathNameLookup(projectFiles.pathPlannerPaths) : new Map<never, never>(),
		getAllChoreoPathNames(projectFiles.choreoPaths),
	]);

	// Have the user select with paths they want to transform
	const rawSelectedPaths = (await groupMultiselect({
		message: 'Which paths would you like to transform?',
		// @ts-expect-error Clack has bad/broken types
		options: createSelectOptions(pathPlannerPathFileToPathName, allChoreoPathNames),
		required: true,
	})) as symbol | PathSelection[];

	if (isCancel(rawSelectedPaths)) {
		cancel('Cancelled path selection');
		process.exit(1);
	}

	// Map the selections to however we resolve the paths in code
	return processSelections(rawSelectedPaths, pathPlannerPathFileToPathName);
}

function processSelections(
	rawSelectedPaths: PathSelection[],
	pathPlannerPathFileToPathName: Map<string, PathPlannerPathNames>,
): SelectedPaths {
	const [rawSelectedChoreoPaths, rawSelectedPathPlannerPaths] = partition(
		rawSelectedPaths,
		(selectedPath) => selectedPath.kind === 'choreo',
	);

	const selectedChoreoPaths = new DefaultMap<string, string[]>(() => []);

	for (const selectedChoreoPath of rawSelectedChoreoPaths) {
		const selectedPathNames = selectedChoreoPaths.get(selectedChoreoPath.settingsFilePath);
		selectedPathNames.push(selectedChoreoPath.pathName);
		selectedChoreoPaths.set(selectedChoreoPath.settingsFilePath, selectedPathNames);
	}

	const selectedPathPlannerPathFiles = rawSelectedPathPlannerPaths.map(
		(selectedPathPlannerPath) => selectedPathPlannerPath.pathFilePath,
	);

	return {
		choreoPaths: selectedChoreoPaths,
		pathPlannerPaths: {
			selectedPathFilePaths: selectedPathPlannerPathFiles,
			pathFileToPathName: new Map(
				pathPlannerPathFileToPathName.entries().map(([pathFilePath, pathName]) => [pathFilePath, pathName.fullName]),
			),
		},
	};
}

function createSelectOptions(
	pathPlannerPathFileToPathName: Map<string, PathPlannerPathNames>,
	allChoreoPathNames: Map<string, string[]>,
): GroupMultiSelectOptions<PathSelection> {
	// Construct the selection options from the path names
	const options: GroupMultiSelectOptions<PathSelection> = {};

	for (const [pathFilePath, pathName] of pathPlannerPathFileToPathName) {
		const key = pathName.dir ? `PathPlanner - ${pathName.dir}` : 'PathPlanner';

		options[key] ??= [];
		options[key].push({
			label: pathName.pathName,
			value: {
				kind: 'path-planner',
				pathFilePath,
			},
		});
	}

	for (const [choreoSettingsFile, choreoPathNames] of allChoreoPathNames) {
		const groupName = `Choreo - ${path.basename(choreoSettingsFile)}`;

		options[groupName] = choreoPathNames.map((pathName) => ({
			label: pathName,
			value: {
				kind: 'choreo',
				pathName,
				settingsFilePath: choreoSettingsFile,
			},
		}));
	}

	for (const value of Object.values(options)) {
		// Sort each of the options by label
		value.sort((a, b) => a.label.localeCompare(b.label));
	}

	return options;
}
