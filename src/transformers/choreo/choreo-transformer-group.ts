import assert from 'node:assert/strict';
import path from 'node:path';
import type { ChoreoPathSelection } from '../../cli/steps/3/select-paths.js';
import type { ChoreoTransformSelection, TransformRequest } from '../../cli/steps/4/select-transforms.js';
import { loadChoreoSettings, writeChoreoSettings } from '../../common/choreo/fs.js';
import type { ChoreoSettings } from '../../common/choreo/types.js';
import { renamePath } from '../renamer.js';
import { type BaseContext, TransformerGroup } from '../transfomer-group.js';
import { ChoreoColorTransformer } from './choreo-color-transformer.js';
import { ChoreoVerticalTransformer } from './choreo-vertical-transformer.js';

type Context = BaseContext & {
	/** Maps settings file paths to their contents. */
	choreoSettings: Map<string, ChoreoSettings>;
};

export class ChoreoTransformerGroup extends TransformerGroup<ChoreoTransformSelection, Context> {
	private static readonly COLOR_TRANSFORMER = new ChoreoColorTransformer();
	private static readonly VERTICAL_TRANSFORMER = new ChoreoVerticalTransformer();
	private static readonly TRANSFORMERS = [this.COLOR_TRANSFORMER, this.VERTICAL_TRANSFORMER];

	protected override async loadContext(paths: ChoreoPathSelection[]): Promise<Context> {
		const fileNames = new Set(paths.map((path) => path.settingsFilePath));

		return {
			newPaths: new Set(),
			choreoSettings: new Map(
				await Promise.all(
					fileNames.values().map(async (fileName) => [fileName, await loadChoreoSettings(fileName)] as const),
				),
			),
		};
	}

	protected override async persistContext(finalContext: Context): Promise<void> {
		await Promise.all(
			finalContext.choreoSettings.entries().map(([fileName, settings]) => writeChoreoSettings(fileName, settings)),
		);
	}

	protected override doTransforms(transforms: ChoreoTransformSelection[], initialContext: Context): Context {
		const transformedContext = initialContext;

		for (const transform of transforms) {
			for (const transformer of ChoreoTransformerGroup.TRANSFORMERS) {
				if (!transformer.shouldTransform(transform)) {
					continue;
				}

				const settingsForThisTransform = transformedContext.choreoSettings.get(transform.path.settingsFilePath);

				assert(settingsForThisTransform, new TypeError('Settings file was not found'));

				const transformedSettings = transformer.doTransform(transform, settingsForThisTransform);

				transformedContext.choreoSettings.set(transform.path.settingsFilePath, transformedSettings);
				transformedContext.newPaths.add(
					`Choreo - ${path.basename(transform.path.settingsFilePath)}/${renamePath(transform.path.pathName, transform.request)}`,
				);
			}
		}

		return transformedContext;
	}

	override possibleTransformsForPath(path: ChoreoTransformSelection['path'], context: Context): TransformRequest {
		const loadedSettings = context.choreoSettings.get(path.settingsFilePath);

		assert(loadedSettings, new TypeError(`Choreo settings file was not found: ${path.settingsFilePath}`));

		const loadedPath = loadedSettings.paths[path.pathName];

		assert(loadedPath, new TypeError(`Choreo path ${path.pathName} not found in ${path.settingsFilePath}`));

		return {
			color: ChoreoTransformerGroup.COLOR_TRANSFORMER.possibleTransform(loadedPath),
			vertical: ChoreoTransformerGroup.VERTICAL_TRANSFORMER.possibleTransform(loadedPath),
		};
	}
}
