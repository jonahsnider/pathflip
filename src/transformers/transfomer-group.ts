import type { TransformSelection } from '../cli/steps/4/select-transforms.js';

export type BaseContext = {
	newPaths: Set<string>;
};

/** Handles loading the context for transformers, and then persisting the modified context once transformations have been applied. */
export abstract class TransformerGroup<T extends TransformSelection, C extends BaseContext> {
	protected abstract loadContext(paths: T['path'][]): Promise<C>;

	protected abstract persistContext(finalContext: C): Promise<void>;

	protected abstract doTransforms(transforms: T[], initialContext: C): C;

	/** Returns a set of human readable names for newly created paths. */
	async run(transforms: T[]): Promise<Set<string>> {
		const initialContext = await this.loadContext(transforms.map((transform) => transform.path));
		const transformedContext = this.doTransforms(transforms, initialContext);
		await this.persistContext(transformedContext);

		return transformedContext.newPaths;
	}

	/** Given a path, return the possible transforms that can be applied to it. */
	protected abstract possibleTransformsForPath(path: T['path'], context: C): T['request'];

	async possibleTransforms(paths: T['path'][]): Promise<T[]> {
		const context = await this.loadContext(paths);

		return paths.map(
			(path): T =>
				({
					path,
					request: this.possibleTransformsForPath(path, context),
				}) as T,
		);
	}
}
