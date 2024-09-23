import { log } from '@clack/prompts';
import { runIntro } from './steps/1/intro.js';
import { scanForProjectFiles } from './steps/2/scan-for-project-files.js';
import { selectPaths } from './steps/3/select-paths.js';
import { selectTransforms } from './steps/4/select-transforms.js';
import { applyTransforms } from './steps/5/apply-transforms.js';

export async function runCli(): Promise<void> {
	runIntro();

	if (process.version.startsWith('v20.')) {
		log.warn('Pathflip requires Node.js v22 or later, you may experience issues with the current version of Node');
	}

	const projectFiles = await scanForProjectFiles();

	const selectedPaths = await selectPaths(projectFiles);

	const selectedTransforms = await selectTransforms(selectedPaths);

	await applyTransforms(selectedTransforms);
}
