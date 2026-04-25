import { multiReplace } from '@jonahsnider/util';
import { angleModulusDegrees } from './common/math-util.js';
import type { Config } from './config.js';

export type TransformWarning = {
	message: string;
};

export type TransformResult = {
	output: string;
	warnings: TransformWarning[];
};

/** Round to 3 decimal places, stripping trailing zeros. */
function round3(value: number): number {
	return Number(value.toFixed(3));
}

/**
 * Rule 1: Flip Pose2d Y-coordinates.
 *
 * Handles two forms of the Y argument:
 *   - Bare numeric literal:        `y' = fieldHeight - y`
 *   - Literal + offset expression: `H - (lit + expr) = (H - lit) - expr`
 *                                  `H - (lit - expr) = (H - lit) + expr`
 *
 * In the offset form, the operator immediately following the literal is flipped
 * and the trailing expression is left untouched (it can be a named constant,
 * a function call like `Units.inchesToMeters(3)`, or another numeric literal).
 *
 * The Y argument is parsed up to the top-level comma that ends it; nested
 * parentheses inside the offset expression are tracked.
 */
function flipPose2dY(source: string, fieldHeight: number): string {
	const marker = /new\s+Pose2d\(/g;
	let result = '';
	let lastIndex = 0;

	for (let match = marker.exec(source); match !== null; match = marker.exec(source)) {
		const argsStart = match.index + match[0].length;

		// Append everything up to and including `new Pose2d(`
		result += source.slice(lastIndex, argsStart);
		lastIndex = argsStart;

		// Parse the X arg: a numeric literal followed by `,`. If we don't see
		// that exact shape, leave the call alone (preserves current behavior
		// for non-literal X).
		const xMatch = source.slice(argsStart).match(/^([\d.]+)\s*,\s*/);
		if (!xMatch) {
			continue;
		}
		const xStr = xMatch[1] as string;
		const afterX = argsStart + xMatch[0].length;

		// Parse the Y arg: starts with a numeric literal.
		const yLitMatch = source.slice(afterX).match(/^([\d.]+)/);
		if (!yLitMatch) {
			continue;
		}
		const yLitStr = yLitMatch[1] as string;
		const yLit = Number(yLitStr);
		const flippedYLit = round3(fieldHeight - yLit);
		const cursor = afterX + yLitStr.length;

		// Look at what follows the literal: whitespace, then either `,` (end of
		// Y arg, plain literal case) or `+`/`-` (offset case).
		const tail = source.slice(cursor);
		const opMatch = tail.match(/^(\s*)([,+-])/);
		if (!opMatch) {
			// Malformed; leave alone.
			continue;
		}
		const ws = opMatch[1] as string;
		const opChar = opMatch[2] as string;

		if (opChar === ',') {
			// Plain literal Y. Replace just the literal.
			result += `${xStr}, ${flippedYLit}`;
			lastIndex = cursor;
			continue;
		}

		// Offset form: `<lit> [+-] <expr>`. Walk forward through the expression
		// tracking paren depth until we hit a top-level `,` or `)`.
		const exprStart = cursor + ws.length + 1; // past the operator
		let depth = 0;
		let exprEnd = exprStart;
		for (; exprEnd < source.length; exprEnd++) {
			const ch = source[exprEnd];
			if (ch === '(') depth++;
			else if (ch === ')') {
				if (depth === 0) break;
				depth--;
			} else if (ch === ',' && depth === 0) {
				break;
			}
		}
		const exprText = source.slice(exprStart, exprEnd);
		const flippedOp = opChar === '+' ? '-' : '+';
		result += `${xStr}, ${flippedYLit} ${flippedOp}${exprText}`;
		lastIndex = exprEnd;
	}

	result += source.slice(lastIndex);
	return result;
}

/** Rule 2: Negate Rotation2d.fromDegrees arguments. */
function negateFromDegrees(source: string, warnings: TransformWarning[]): string {
	return source.replace(/Rotation2d\.fromDegrees\(([^)]+)\)/g, (_match, expr: string) => {
		const trimmed = expr.trim();

		// Simple number literal (e.g., `40.0`, `-90`, `0`)
		const numberMatch = trimmed.match(/^-?[\d.]+$/);
		if (numberMatch) {
			const value = Number(trimmed);
			const negated = round3(angleModulusDegrees(-value));
			return `Rotation2d.fromDegrees(${negated})`;
		}

		// Expression: `180 + X` or `180 - X`
		const expr180Match = trimmed.match(/^180\s*([+-])\s*(.+)$/);
		if (expr180Match) {
			const op = expr180Match[1] === '+' ? '-' : '+';
			const rest = expr180Match[2];
			return `Rotation2d.fromDegrees(180 ${op} ${rest})`;
		}

		// Unrecognized expression — leave unchanged, emit warning
		warnings.push({ message: `Unrecognized expression in Rotation2d.fromDegrees(${expr}), leaving unchanged` });
		return _match;
	});
}

/** Rule 3: Swap Rotation2d constants (kCW_90deg ↔ kCCW_90deg). */
function swapRotation2dConstants(source: string): string {
	const swapMap: Record<string, string> = {
		kCW_90deg: 'kCCW_90deg',
		kCCW_90deg: 'kCW_90deg',
		kZero: 'kZero',
		k180deg: 'k180deg',
	};

	return source.replace(/Rotation2d\.(kZero|k180deg|kCW_90deg|kCCW_90deg)/g, (_match, constant: string) => {
		return `Rotation2d.${swapMap[constant]}`;
	});
}

/** Rule 4: Negate configured constant declarations. */
function negateConstantDeclarations(source: string, negateConstants: string[]): string {
	if (negateConstants.length === 0) {
		return source;
	}

	const escaped = negateConstants.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
	const pattern = new RegExp(
		`(private\\s+static\\s+final\\s+double\\s+(?:${escaped.join('|')})\\s*=\\s*)(-?[\\d.]+)`,
		'g',
	);

	return source.replace(pattern, (_match, prefix: string, valueStr: string) => {
		const value = Number(valueStr);
		return `${prefix}${round3(-value)}`;
	});
}

/** Rule 5: Negate the Y-offset (second numeric arg) in `.withArcExtension(Point, xOffset, yOffset, ...)`. */
function negateArcExtensionYOffset(source: string): string {
	const marker = '.withArcExtension(';
	let result = '';
	let searchFrom = 0;

	while (true) {
		const idx = source.indexOf(marker, searchFrom);
		if (idx === -1) {
			result += source.slice(searchFrom);
			break;
		}

		result += source.slice(searchFrom, idx);

		// Find the matching closing paren for the withArcExtension call
		const argsStart = idx + marker.length;
		let depth = 1;
		let argsEnd = argsStart;
		for (; argsEnd < source.length && depth > 0; argsEnd++) {
			if (source[argsEnd] === '(') depth++;
			if (source[argsEnd] === ')') depth--;
		}
		// argsEnd is now one past the closing ')'
		const fullCall = source.slice(idx, argsEnd);
		const argsStr = source.slice(argsStart, argsEnd - 1);

		// Find the first top-level comma (end of Point arg)
		depth = 0;
		let pointEnd = -1;
		for (let i = 0; i < argsStr.length; i++) {
			if (argsStr[i] === '(') depth++;
			if (argsStr[i] === ')') depth--;
			if (depth === 0 && argsStr[i] === ',') {
				pointEnd = i;
				break;
			}
		}

		if (pointEnd === -1) {
			result += fullCall;
			searchFrom = argsEnd;
			continue;
		}

		const pointPart = argsStr.slice(0, pointEnd);
		const rest = argsStr.slice(pointEnd);

		// Match: , <xOffset>, <yOffset>
		const numericArgsMatch = rest.match(/^(,\s*-?[\d.]+)(,\s*)(-?[\d.]+)/);
		if (!numericArgsMatch) {
			result += fullCall;
			searchFrom = argsEnd;
			continue;
		}

		// biome-ignore lint/style/noNonNullAssertion: regex capture groups are guaranteed
		const xOffsetPart = numericArgsMatch[1]!;
		// biome-ignore lint/style/noNonNullAssertion: regex capture groups are guaranteed
		const separator = numericArgsMatch[2]!;
		// biome-ignore lint/style/noNonNullAssertion: regex capture groups are guaranteed
		const yOffsetStr = numericArgsMatch[3]!;
		const afterYOffset = rest.slice(numericArgsMatch[0].length);

		const yOffset = Number(yOffsetStr);
		const negatedY = round3(-yOffset);

		// Preserve trailing .0 if the original had a decimal point
		const negatedYStr =
			yOffsetStr.includes('.') && !String(negatedY).includes('.') ? `${negatedY}.0` : String(negatedY);

		result += `.withArcExtension(${pointPart}${xOffsetPart}${separator}${negatedYStr}${afterYOffset})`;
		searchFrom = argsEnd;
	}

	return result;
}

/** Rule 6: Flip +/- signs before expressions following `.getY()`. */
function flipGetYOffsetSigns(source: string): string {
	return source.replace(/\.getY\(\)\s*([+-])\s*/g, (_match, sign: string) => {
		const flipped = sign === '+' ? '-' : '+';
		return `.getY() ${flipped} `;
	});
}

/** Rule 7: Simultaneous string replacements. */
function applyReplacements(source: string, replacements: Record<string, string>): string {
	if (Object.keys(replacements).length === 0) {
		return source;
	}

	return multiReplace(source, replacements);
}

/** Apply all transformation rules to Java source code. */
export function transform(source: string, config: Config): TransformResult {
	const warnings: TransformWarning[] = [];

	let output = source;
	output = flipPose2dY(output, config.fieldHeight);
	output = negateFromDegrees(output, warnings);
	output = swapRotation2dConstants(output);
	output = negateConstantDeclarations(output, config.negateConstants);
	output = negateArcExtensionYOffset(output);
	output = flipGetYOffsetSigns(output);
	output = applyReplacements(output, config.replacements);

	return { output, warnings };
}
