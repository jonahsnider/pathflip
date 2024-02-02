import { TransformRequest } from './transform-request.js';

export function transformName(name: string, transform: TransformRequest): string {
	let transformed: string | undefined;
	switch (transform.color) {
		case 'blue2red': {
			transformed = name.replaceAll(/blue/gi, (found) => (found === 'blue' ? 'red' : 'Red'));
			break;
		}
		case 'red2blue': {
			transformed = name.replaceAll(/red/gi, (found) => (found === 'red' ? 'blue' : 'Blue'));
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
