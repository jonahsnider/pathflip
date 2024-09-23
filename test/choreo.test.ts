import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import type { ChoreoPathSelection } from '../src/cli/steps/3/select-paths.js';
import { choreoTransformer } from '../src/transformers/transformers.js';

describe('Choreo transforms', () => {
	test.fails('generates headings bounded by -180 and 180', async () => {
		const choreoPath: ChoreoPathSelection = {
			kind: 'choreo',
			settingsFilePath: path.join(import.meta.dirname, 'fixtures', 'choreo1.chor'),
			pathName: 'Red CWS to 6',
		};

		// biome-ignore lint/complexity/useLiteralKeys: This is to access a private field
		const context = await choreoTransformer['loadContext']([choreoPath]);

		// biome-ignore lint/complexity/useLiteralKeys: This is to access a private field
		const result = choreoTransformer['doTransforms'](
			[
				{
					path: choreoPath,
					request: { color: 'red2blue', vertical: undefined },
				},
			],
			context,
		);

		const outputSettings = result.choreoSettings.get(choreoPath.settingsFilePath);
		assert(outputSettings);

		const outputPath = outputSettings.paths['Blue CWS to 6'];
		assert(outputPath);

		// biome-ignore lint/style/noUnusedTemplateLiteral: This is a test snapshot
		expect(outputPath.waypoints[0]?.heading).toMatchInlineSnapshot(`2.9063772775412318`);
	});
});
