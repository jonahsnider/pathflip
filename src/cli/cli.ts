import { listAutos } from '../autos/autos.js';
import { transformAutos } from '../transforms/transforms.js';
import { afterTransformApproved } from './steps/after-transform.js';
import { cancelledOverwriteConfirm } from './steps/cancelled-overwrite-confirm.js';
import { cancelledAutoSelect } from './steps/cancelled-path-select.js';
import { cancelledTransformSelect } from './steps/cancelled-transform-select.js';
import { confirmOverwrite } from './steps/confirm-overwrite.js';
import { runIntro } from './steps/intro.js';
import { noAutosDir } from './steps/no-paths-dir.js';
import { noAutosInDir } from './steps/no-paths-in-dir.js';
import { rejectedOverwrite } from './steps/rejected-overwrite.js';
import { selectAutos } from './steps/select-autos.js';
import { selectTransforms } from './steps/select-transforms.js';

export async function runCli(): Promise<boolean> {
	runIntro();

	const projectDir = process.cwd();

	const allAutos = await listAutos(projectDir);

	if (!allAutos) {
		noAutosDir();
		return false;
	}

	if (allAutos.length === 0) {
		noAutosInDir();
		return false;
	}

	const selectedAutos = await selectAutos(allAutos);

	if (!selectedAutos) {
		cancelledAutoSelect();
		return false;
	}

	const transforms = await selectTransforms(selectedAutos);

	if (!transforms) {
		cancelledTransformSelect();
		return false;
	}

	const { existingAutos, existingPaths, output } = await transformAutos(transforms);

	if (existingAutos.length > 0 || existingPaths.size > 0) {
		const overwriteApproved = await confirmOverwrite(selectedAutos, existingAutos, existingPaths);

		if (overwriteApproved === undefined) {
			cancelledOverwriteConfirm();
			return false;
		}

		if (!overwriteApproved) {
			rejectedOverwrite();
			return true;
		}
	}

	await afterTransformApproved(output);

	return true;
}
