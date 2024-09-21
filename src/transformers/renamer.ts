import { multiReplace } from '@jonahsnider/util';
import type { TransformRequest } from '../cli/steps/4/select-transforms.js';

export function renamePath(name: string, transformRequest: TransformRequest): string {
	let transformed = name;

	switch (transformRequest.color) {
		case 'blue2red': {
			transformed = multiReplace(transformed, {
				blue: 'red',
				// biome-ignore lint/style/useNamingConvention: This has to be uppercase
				Blue: 'Red',
			});
			break;
		}
		case 'red2blue': {
			transformed = multiReplace(transformed, {
				red: 'blue',
				// biome-ignore lint/style/useNamingConvention: This has to be uppercase
				Red: 'Blue',
			});
			break;
		}
	}
	switch (transformRequest.vertical) {
		case 'bottom2top': {
			transformed = multiReplace(transformed, {
				bottom: 'top',
				// biome-ignore lint/style/useNamingConvention: This has to be uppercase
				Bottom: 'Top',
			});
			break;
		}
		case 'top2bottom': {
			transformed = multiReplace(transformed, {
				top: 'bottom',
				// biome-ignore lint/style/useNamingConvention: This has to be uppercase
				Top: 'Bottom',
			});
			break;
		}
	}

	if (transformed === name) {
		const parts: string[] = [];

		if (transformRequest.color) {
			// biome-ignore lint/style/noNonNullAssertion: This is safe
			parts.push(transformRequest.color.split('2')[1]!);
		}

		if (transformRequest.vertical) {
			// biome-ignore lint/style/noNonNullAssertion: This is safe
			parts.push(transformRequest.vertical.split('2')[1]!);
		}

		if (parts.length === 0) {
			// No transformation happened, so reusing the same name is fine
			return name;
		}

		transformed = `${parts.join('_')}_${transformed}`;
	}

	return transformed ?? name;
}
