import { describe, expect, test } from 'vitest';
import { angleModulusRadians } from '../src/common/math-util.js';

describe('math util angle normalization', () => {
	test('normalizes angles between (-pi, pi]', () => {
		expect(angleModulusRadians(3.5464844398748765)).toBeCloseTo(-2.7367008673047097);

		expect(angleModulusRadians(-Math.PI)).toBe(Math.PI);
	});
});
