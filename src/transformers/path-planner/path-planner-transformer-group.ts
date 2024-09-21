import assert from 'node:assert/strict';
import path from 'node:path';
import type { PathPlannerPathSelection } from '../../cli/steps/3/select-paths.js';
import type { PathPlannerTransformSelection, TransformRequest } from '../../cli/steps/4/select-transforms.js';
import {
	loadPathPlannerPath,
	loadPathPlannerSettings,
	writePathPlannerPath,
	writePathPlannerSettings,
} from '../../common/path-planner/fs.js';
import type { PathPlannerPath, PathPlannerSettings } from '../../common/path-planner/types.js';
import { type BaseContext, TransformerGroup } from '../transfomer-group.js';
import { PathPlannerColorTransformer } from './path-planner-color-transformer.js';
import { PathPlannerVerticalTransformer } from './path-planner-vertical-transformer.js';

/** Maps settings file paths to their contents. */
export type PathPlannerProject = {
	settings: PathPlannerSettings;
	/** Maps path file paths to their contents. */
	paths: Map<string, PathPlannerPath>;
	projectRoot: string;
};

type Context = BaseContext & {
	project: PathPlannerProject;
};

export class PathPlannerTransformerGroup extends TransformerGroup<PathPlannerTransformSelection, Context> {
	private static readonly COLOR_TRANSFORMER = new PathPlannerColorTransformer();
	private static readonly VERTICAL_TRANSFORMER = new PathPlannerVerticalTransformer();
	private static readonly TRANSFORMERS = [this.COLOR_TRANSFORMER, this.VERTICAL_TRANSFORMER];

	/** Updates the provided settings in place to include any path folders that were created as part of transformations. */
	private static addMissingPathFoldersToSettings(
		settings: PathPlannerSettings,
		paths: Iterable<PathPlannerPath>,
	): void {
		const pathFolders = new Set(settings.pathFolders);

		for (const path of paths) {
			if (path.folder) {
				pathFolders.add(path.folder);
			}
		}

		settings.pathFolders = Array.from(pathFolders);
	}

	protected override async loadContext(paths: PathPlannerPathSelection[]): Promise<Context> {
		const projectRoot = process.cwd();

		// We need to load the individual paths, and the settings file for the whole project
		const [settings, ...loadedPaths] = await Promise.all([
			loadPathPlannerSettings(projectRoot),
			...paths.map(async (path) => [path.pathFilePath, await loadPathPlannerPath(path.pathFilePath)] as const),
		]);

		return {
			project: {
				paths: new Map(loadedPaths),
				settings,
				projectRoot,
			},
			newPaths: new Set(),
		};
	}

	protected override async persistContext(finalContext: Context): Promise<void> {
		// Before we persist the settings, we need to make sure that any dirs we created are included in the settings
		PathPlannerTransformerGroup.addMissingPathFoldersToSettings(
			finalContext.project.settings,
			finalContext.project.paths.values(),
		);

		await Promise.all([
			writePathPlannerSettings(finalContext.project.projectRoot, finalContext.project.settings),
			...finalContext.project.paths
				.entries()
				.map(async ([pathFilePath, path]) => writePathPlannerPath(pathFilePath, path)),
		]);
	}

	override doTransforms(transforms: PathPlannerTransformSelection[], initialContext: Context): Context {
		const transformedContext = initialContext;

		for (const transform of transforms) {
			for (const transformer of PathPlannerTransformerGroup.TRANSFORMERS) {
				if (!transformer.shouldTransform(transform)) {
					continue;
				}

				transformedContext.project = transformer.doTransform(transform, transformedContext.project);

				const transformedPath = transformedContext.project.paths.get(transform.path.pathFilePath);
				assert(
					transformedPath,
					new TypeError(`Newly transformed path ${transform.path.pathFilePath} was not found in project draft`),
				);

				const pathName = path.basename(transform.path.pathFilePath, '.path');
				const fullPathDisplayName = transformedPath.folder ? `${transformedPath.folder}/${pathName}` : pathName;
				transformedContext.newPaths.add(`PathPlanner - ${fullPathDisplayName}`);
			}
		}

		return transformedContext;
	}

	protected override possibleTransformsForPath(path: PathPlannerPathSelection, context: Context): TransformRequest {
		const loadedPath = context.project.paths.get(path.pathFilePath);

		assert(loadedPath, new TypeError(`PathPlanner path ${path.pathFilePath} was missing`));

		return {
			color: PathPlannerTransformerGroup.COLOR_TRANSFORMER.possibleTransform(loadedPath),
			vertical: PathPlannerTransformerGroup.VERTICAL_TRANSFORMER.possibleTransform(loadedPath),
		};
	}
}
