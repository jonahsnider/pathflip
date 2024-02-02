import { log, outro } from '@clack/prompts';
import { writeAutoEntry } from '../../autos/auto.js';
import { AutoEntry } from '../../autos/autos.js';
import { treePrefix } from '../formatting.js';

export async function afterTransformApproved(output: AutoEntry[]): Promise<void> {
	await Promise.all(
		output.map(async (auto) => {
			await writeAutoEntry(auto);
		}),
	);

	log.success(['Transformed autos:', ...output.map((auto) => auto.nameWithDir).map(treePrefix)].join('\n'));

	outro('Finished! Exiting...');
}
