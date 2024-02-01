import { groupMultiselect, log } from '@clack/prompts';
import { PATHS_DIR_MISSING, flattenPathTree, listPaths } from '../paths/paths.js';
import { cancelledPathSelect } from './steps/cancelled-path-select.js';
import { confirmProjectDir } from './steps/confirm-project-dir.js';
import { incorrectProjectDir } from './steps/incorrect-project-dir.js';
import { runIntro } from './steps/intro.js';
import { noPathsDir } from './steps/no-paths-dir.js';
import { noPathsInDir } from './steps/no-paths-in-dir.js';
import { selectPaths } from './steps/select-paths.js';
import { selectTransforms } from './steps/select-transforms.js';
import { cancelledTransformSelect } from './steps/cancelled-transform-select.js';

export async function runCli(): Promise<boolean> {
	runIntro();

	const projectDir = await confirmProjectDir();

	if (!projectDir) {
		incorrectProjectDir();
		return false;
	}

	const allPaths = await listPaths(projectDir);

	if (allPaths === PATHS_DIR_MISSING) {
		noPathsDir();
		return false;
	}

	const flattenedPathTree = flattenPathTree(allPaths);

	if (flattenedPathTree.length === 0) {
		noPathsInDir();
		return false;
	}

	const selectedPaths = await selectPaths(flattenedPathTree);

	if (!selectedPaths) {
		cancelledPathSelect();
		return false;
	}

	const transforms = await selectTransforms(selectedPaths);

	if (!transforms) {
		cancelledTransformSelect();
		return false;
	}

	console.log(transforms);

	return true;
}
