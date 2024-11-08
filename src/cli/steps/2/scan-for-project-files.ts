import { cancel } from '@clack/prompts';
import { type ChoreoProjectFilesPaths, scanForChoreoProjectFiles } from './choreo.js';
import { type PathPlannerProjectFilesPaths, scanForPathPlannerProjectFiles } from './path-planner.js';

export type ProjectFilesScanResult = {
	pathPlannerPaths: PathPlannerProjectFilesPaths | undefined;
	choreoPaths: ChoreoProjectFilesPaths;
};

/**
 * Check the project for Choreo & PathPlanner paths that can be transformed.
 */
export async function scanForProjectFiles(): Promise<ProjectFilesScanResult> {
	const projectDir = process.cwd();

	const [pathPlannerPaths, choreoPaths] = await Promise.all([
		scanForPathPlannerProjectFiles(projectDir),
		scanForChoreoProjectFiles(projectDir),
	]);

	if (!pathPlannerPaths && choreoPaths.settingsFilePaths.length === 0) {
		cancel('No PathPlanner or Choreo files were found in the project, are you in the right directory?');
		process.exit(1);
	}

	return {
		pathPlannerPaths,
		choreoPaths,
	};
}
