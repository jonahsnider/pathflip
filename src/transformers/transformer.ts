import type { TransformSelection } from '../cli/steps/4/select-transforms.js';

export abstract class Transformer<T extends TransformSelection, C> {
	/** Whether this transformer should be applied to the given request. */
	abstract shouldTransform(transform: TransformSelection): transform is T;

	/** Apply the requested transform and return the context with the transforms applied. */
	abstract doTransform(transform: T, context: C): C;
}
