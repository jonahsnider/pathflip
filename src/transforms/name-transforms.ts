import { multiReplace } from '@jonahsnider/util';
import { TransformRequest } from './transform-request.js';

export function transformName(name: string, transform: TransformRequest): string {
	let transformed = name;

	switch (transform.color) {
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
	switch (transform.vertical) {
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

		if (transform.color) {
			// biome-ignore lint/style/noNonNullAssertion: This is safe
			parts.push(transform.color.split('2')[1]!);
		}

		if (transform.vertical) {
			// biome-ignore lint/style/noNonNullAssertion: This is safe
			parts.push(transform.vertical.split('2')[1]!);
		}

		if (parts.length === 0) {
			// No transformation happened, so reusing the same name is fine
			return name;
		}

		transformed = `${parts.join('_')}_${transformed}`;
	}

	return transformed ?? name;
}
