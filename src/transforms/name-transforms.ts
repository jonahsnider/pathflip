import { TransformRequest } from './transform-request.js';

export function transformName(name: string, transform: TransformRequest): string {
	let transformed = name;

	switch (transform.color) {
		case 'blue2red': {
			transformed = transformed.replaceAll(/blue/gi, (found) => (found === 'blue' ? 'red' : 'Red'));
			break;
		}
		case 'red2blue': {
			transformed = transformed.replaceAll(/red/gi, (found) => (found === 'red' ? 'blue' : 'Blue'));
			break;
		}
	}
	switch (transform.vertical) {
		case 'bottom2top': {
			transformed = transformed.replaceAll(/bottom/gi, (found) => (found === 'bottom' ? 'top' : 'Top'));
			break;
		}
		case 'top2bottom': {
			transformed = transformed.replaceAll(/top/gi, (found) => (found === 'top' ? 'bottom' : 'Bottom'));
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
