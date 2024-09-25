import { describe, expect, test } from 'vitest';
import { angleModulusRadians } from '../src/common/math-util.js';

describe('math util angle normalization', () => {
	test('normalizes angles between -pi and pi', () => {
		const angle = 3.5464844398748765;

		expect(angleModulusRadians(angle)).toBeCloseTo(-2.7367008673047097);
	});
});
