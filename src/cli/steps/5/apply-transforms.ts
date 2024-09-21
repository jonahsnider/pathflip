import { log, outro } from '@clack/prompts';
import { concatIterables, join } from '@jonahsnider/util';
import picocolors from 'picocolors';
import { choreoTransformer, pathPlannerTransformer } from '../../../transformers/transformers.js';
import type {
	ChoreoTransformSelection,
	PathPlannerTransformSelection,
	TransformSelection,
} from '../4/select-transforms.js';

export async function applyTransforms(transforms: TransformSelection[]): Promise<void> {
	const choreoTransforms = transforms.filter(
		(transform): transform is ChoreoTransformSelection => transform.path.kind === 'choreo',
	);
	const pathPlannerTransforms = transforms.filter(
		(transform): transform is PathPlannerTransformSelection => transform.path.kind === 'path-planner',
	);

	const [newChoreoPathDisplayNames, newPathPlannerPathDisplayNames] = await Promise.all([
		choreoTransformer.run(choreoTransforms),
		pathPlannerTransformer.run(pathPlannerTransforms),
	]);

	const newPathsList = join(
		Iterator.from(concatIterables(newChoreoPathDisplayNames, newPathPlannerPathDisplayNames)).map((displayName) =>
			picocolors.dim(displayName),
		),
		'\n',
	);

	log.step(`New paths:\n${newPathsList}`);

	outro('Finished! Exiting...');
}
