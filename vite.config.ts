import { defineConfig } from 'vite-plus';

export default defineConfig({
	pack: {
		entry: ['src/index.ts'],
		outDir: 'dist/src',
		platform: 'node',
		sourcemap: true,
		target: 'node22',
	},
	staged: {
		'*': 'vp check --fix',
	},
	fmt: {
		ignorePatterns: ['dist/**', 'coverage/**', 'src/generated/**', '**/*.md', 'PklProject.deps.json'],
		printWidth: 120,
		singleQuote: true,
		useTabs: true,
	},
	lint: {
		categories: {
			correctness: 'error',
			perf: 'error',
		},
		ignorePatterns: ['dist/**', 'coverage/**', 'src/generated/**'],
		jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
		options: { typeAware: true, typeCheck: true },
		rules: { 'vite-plus/prefer-vite-plus-imports': 'error' },
	},
});
