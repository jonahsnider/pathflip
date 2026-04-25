import { describe, expect, test } from 'vitest';
import type { Config } from '../src/config.js';
import { transform } from '../src/transform.js';

const baseConfig: Config = {
	fieldHeight: 8.069,
	replacements: {
		Right: 'Left',
		right: 'left',
		RIGHT: 'LEFT',
		Left: 'Right',
		left: 'right',
		LEFT: 'RIGHT',
	},
	negateConstants: ['BUMP_OFFSET'],
};

describe('transform', () => {
	describe('rule 1: Pose2d Y-coordinate flip', () => {
		test('flips Y coordinate', () => {
			const input = 'new Pose2d(12.1, 7.6, Rotation2d.kZero)';
			const { output } = transform(input, { ...baseConfig, replacements: {}, negateConstants: [] });
			expect(output).toBe('new Pose2d(12.1, 0.469, Rotation2d.kZero)');
		});

		test('handles multiple Pose2d on same line', () => {
			const input = 'new Pose2d(1.0, 2.0, r), new Pose2d(3.0, 4.0, r)';
			const { output } = transform(input, { ...baseConfig, replacements: {}, negateConstants: [] });
			expect(output).toBe('new Pose2d(1.0, 6.069, r), new Pose2d(3.0, 4.069, r)');
		});

		test('strips trailing zeros', () => {
			const input = 'new Pose2d(1.0, 3.069, r)';
			const { output } = transform(input, { ...baseConfig, replacements: {}, negateConstants: [] });
			expect(output).toBe('new Pose2d(1.0, 5, r)');
		});

		test('flips literal Y plus a named offset constant', () => {
			const input = 'new Pose2d(10.2, 5.4 + BUMP_OFFSET, Rotation2d.kZero)';
			const { output } = transform(input, { ...baseConfig, replacements: {}, negateConstants: [] });
			expect(output).toBe('new Pose2d(10.2, 2.669 - BUMP_OFFSET, Rotation2d.kZero)');
		});

		test('flips literal Y minus a named offset constant', () => {
			const input = 'new Pose2d(10.2, 5.4 - BUMP_OFFSET, Rotation2d.kZero)';
			const { output } = transform(input, { ...baseConfig, replacements: {}, negateConstants: [] });
			expect(output).toBe('new Pose2d(10.2, 2.669 + BUMP_OFFSET, Rotation2d.kZero)');
		});

		test('flips literal Y plus a function call offset (with nested parens)', () => {
			const input = 'new Pose2d(10.2, 5.4 + Units.inchesToMeters(3), Rotation2d.kZero)';
			const { output } = transform(input, { ...baseConfig, replacements: {}, negateConstants: [] });
			expect(output).toBe('new Pose2d(10.2, 2.669 - Units.inchesToMeters(3), Rotation2d.kZero)');
		});

		test('flips literal Y minus a function call offset', () => {
			const input = 'new Pose2d(10.2, 5.4 - Units.inchesToMeters(3), Rotation2d.kZero)';
			const { output } = transform(input, { ...baseConfig, replacements: {}, negateConstants: [] });
			expect(output).toBe('new Pose2d(10.2, 2.669 + Units.inchesToMeters(3), Rotation2d.kZero)');
		});

		test('idempotent: applying twice on offset form returns original', () => {
			const original = 'new Pose2d(10.2, 5.4 + BUMP_OFFSET, Rotation2d.kZero)';
			const { output: once } = transform(original, { ...baseConfig, replacements: {}, negateConstants: [] });
			const { output: twice } = transform(once, { ...baseConfig, replacements: {}, negateConstants: [] });
			expect(twice).toBe(original);
		});
	});

	describe('rule 2: Rotation2d.fromDegrees negation', () => {
		test('negates simple number', () => {
			const input = 'Rotation2d.fromDegrees(40.0)';
			const { output } = transform(input, { ...baseConfig, replacements: {}, negateConstants: [] });
			expect(output).toBe('Rotation2d.fromDegrees(-40)');
		});

		test('negates negative number', () => {
			const input = 'Rotation2d.fromDegrees(-90)';
			const { output } = transform(input, { ...baseConfig, replacements: {}, negateConstants: [] });
			expect(output).toBe('Rotation2d.fromDegrees(90)');
		});

		test('normalizes 180 to 180', () => {
			const input = 'Rotation2d.fromDegrees(180)';
			const { output } = transform(input, { ...baseConfig, replacements: {}, negateConstants: [] });
			expect(output).toBe('Rotation2d.fromDegrees(180)');
		});

		test('flips 180 + X to 180 - X', () => {
			const input = 'Rotation2d.fromDegrees(180 + 30)';
			const { output } = transform(input, { ...baseConfig, replacements: {}, negateConstants: [] });
			expect(output).toBe('Rotation2d.fromDegrees(180 - 30)');
		});

		test('flips 180 - X to 180 + X', () => {
			const input = 'Rotation2d.fromDegrees(180 - angle)';
			const { output } = transform(input, { ...baseConfig, replacements: {}, negateConstants: [] });
			expect(output).toBe('Rotation2d.fromDegrees(180 + angle)');
		});

		test('leaves unrecognized expressions unchanged and warns', () => {
			const input = 'Rotation2d.fromDegrees(someVar * 2)';
			const { output, warnings } = transform(input, { ...baseConfig, replacements: {}, negateConstants: [] });
			expect(output).toBe('Rotation2d.fromDegrees(someVar * 2)');
			expect(warnings).toHaveLength(1);
			expect(warnings[0]?.message).toContain('Unrecognized expression');
		});
	});

	describe('rule 3: Rotation2d constant swap', () => {
		test('swaps kCW_90deg to kCCW_90deg', () => {
			const input = 'Rotation2d.kCW_90deg';
			const { output } = transform(input, { ...baseConfig, replacements: {}, negateConstants: [] });
			expect(output).toBe('Rotation2d.kCCW_90deg');
		});

		test('swaps kCCW_90deg to kCW_90deg', () => {
			const input = 'Rotation2d.kCCW_90deg';
			const { output } = transform(input, { ...baseConfig, replacements: {}, negateConstants: [] });
			expect(output).toBe('Rotation2d.kCW_90deg');
		});

		test('leaves kZero unchanged', () => {
			const input = 'Rotation2d.kZero';
			const { output } = transform(input, { ...baseConfig, replacements: {}, negateConstants: [] });
			expect(output).toBe('Rotation2d.kZero');
		});

		test('leaves k180deg unchanged', () => {
			const input = 'Rotation2d.k180deg';
			const { output } = transform(input, { ...baseConfig, replacements: {}, negateConstants: [] });
			expect(output).toBe('Rotation2d.k180deg');
		});
	});

	describe('rule 4: constant sign negation', () => {
		test('negates a positive constant', () => {
			const input = 'private static final double BUMP_OFFSET = 0.5;';
			const { output } = transform(input, { ...baseConfig, replacements: {} });
			expect(output).toBe('private static final double BUMP_OFFSET = -0.5;');
		});

		test('negates a negative constant', () => {
			const input = 'private static final double BUMP_OFFSET = -1.23;';
			const { output } = transform(input, { ...baseConfig, replacements: {} });
			expect(output).toBe('private static final double BUMP_OFFSET = 1.23;');
		});

		test('ignores constants not in the list', () => {
			const input = 'private static final double OTHER_CONST = 5.0;';
			const { output } = transform(input, { ...baseConfig, replacements: {} });
			expect(output).toBe(input);
		});
	});

	describe('rule 5: arc extension Y-offset negation', () => {
		test('negates Y-offset in withArcExtension with 2 numeric args', () => {
			const input = '.withArcExtension(Point.ofRed(new Pose2d(9.0, 4.7, Rotation2d.kCW_90deg)), 0, -0.51)';
			const { output } = transform(input, { ...baseConfig, replacements: {}, negateConstants: [] });
			expect(output).toContain(', 0, 0.51)');
		});

		test('negates Y-offset in withArcExtension with 3 numeric args and Rotation2d', () => {
			const input =
				'.withArcExtension(Point.ofRed(new Pose2d(9.5, 4.4, Rotation2d.kCW_90deg)), -0.0525, -0.51, Rotation2d.fromDegrees(12.0))';
			const { output } = transform(input, { ...baseConfig, replacements: {}, negateConstants: [] });
			expect(output).toContain(', -0.0525, 0.51,');
		});

		test('preserves trailing .0 when negating whole numbers', () => {
			const input = '.withArcExtension(Point.ofRed(new Pose2d(7.983, 4.4, Rotation2d.kCW_90deg)), 0.071, -1.0)';
			const { output } = transform(input, { ...baseConfig, replacements: {}, negateConstants: [] });
			expect(output).toContain(', 0.071, 1.0)');
		});

		test('leaves X-offset unchanged', () => {
			const input = '.withArcExtension(Point.ofRed(new Pose2d(8.75, 4.4, Rotation2d.kCW_90deg)), 0.5, -0.51)';
			const { output } = transform(input, { ...baseConfig, replacements: {}, negateConstants: [] });
			expect(output).toContain(', 0.5, 0.51)');
		});
	});

	describe('rule 6: getY() offset sign flip', () => {
		test('flips + to - after .getY()', () => {
			const input = 'FieldUtil.RED_OUTPOST_TRENCH_CENTER.getY() + Units.inchesToMeters(3)';
			const { output } = transform(input, { ...baseConfig, replacements: {}, negateConstants: [] });
			expect(output).toContain('.getY() - Units.inchesToMeters(3)');
		});

		test('flips - to + after .getY()', () => {
			const input = 'FieldUtil.RED_DEPOT_TRENCH_CENTER.getY() - Units.inchesToMeters(3)';
			const { output } = transform(input, { ...baseConfig, replacements: {}, negateConstants: [] });
			expect(output).toContain('.getY() + Units.inchesToMeters(3)');
		});
	});

	describe('rule 7: string multi-replace', () => {
		test('replaces Right with Left and Left with Right simultaneously', () => {
			const input = 'RightIntegratedAuto extends LeftBase';
			const { output } = transform(input, { ...baseConfig, negateConstants: [] });
			expect(output).toBe('LeftIntegratedAuto extends RightBase');
		});

		test('handles case-sensitive replacements', () => {
			const input = 'RIGHT right Right';
			const { output } = transform(input, { ...baseConfig, negateConstants: [] });
			expect(output).toBe('LEFT left Left');
		});
	});

	describe('integration', () => {
		test('transforms a realistic Java snippet', () => {
			const input = [
				'public class RightIntegratedAuto {',
				'  private static final double BUMP_OFFSET = 0.5;',
				'  Pose2d start = new Pose2d(12.1, 7.6, Rotation2d.fromDegrees(40.0));',
				'  Rotation2d turn = Rotation2d.kCW_90deg;',
				'  Rotation2d flip = Rotation2d.fromDegrees(180 + 30);',
				'}',
			].join('\n');

			const { output, warnings } = transform(input, baseConfig);

			expect(warnings).toHaveLength(0);
			expect(output).toContain('public class LeftIntegratedAuto');
			expect(output).toContain('BUMP_OFFSET = -0.5');
			expect(output).toContain('new Pose2d(12.1, 0.469');
			expect(output).toContain('Rotation2d.fromDegrees(-40)');
			expect(output).toContain('Rotation2d.kCCW_90deg');
			expect(output).toContain('Rotation2d.fromDegrees(180 - 30)');
		});

		test('idempotency: Right → Left → Right produces original', () => {
			const original = [
				'public class RightAuto {',
				'  private static final double BUMP_OFFSET = 0.5;',
				'  Pose2d p = new Pose2d(1.0, 2, Rotation2d.fromDegrees(45));',
				'  Rotation2d r = Rotation2d.kCW_90deg;',
				'  .withArcExtension(Point.ofRed(new Pose2d(9.0, 4.7, Rotation2d.kCW_90deg)), 0, -0.51)',
				'  FieldUtil.RIGHT_TRENCH.getY() + Units.inchesToMeters(3)',
				'}',
			].join('\n');

			const { output: left } = transform(original, baseConfig);
			const { output: backToRight } = transform(left, baseConfig);

			expect(backToRight).toBe(original);
		});
	});
});
