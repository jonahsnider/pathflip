import { AutoEntry, getExistingAutos } from '../autos/autos.js';
import { PathEntry, getExistingPaths } from '../paths/paths.js';
import { AutoWithTransforms, transformAuto } from '../transforms/auto-transforms.js';

export async function transformAutos(transforms: AutoWithTransforms[]): Promise<{
	existingAutos: AutoEntry[];
	existingPaths: Map<AutoEntry, PathEntry[]>;
	output: AutoEntry[];
}> {
	const output = transforms.map((transform) => transformAuto(transform.auto, transform.transform));

	const existingAutos = await getExistingAutos(output);

	const existingPaths: Map<AutoEntry, PathEntry[]> = new Map(
		(await Promise.all(output.map(async (auto) => [auto, await getExistingPaths(auto.paths)] as const))).filter(
			([, paths]) => paths.length > 0,
		),
	);

	return {
		existingAutos,
		existingPaths,
		output,
	};
}
