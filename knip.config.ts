import type { KnipConfig } from 'knip';

const config: KnipConfig = {
	// Generated Pkl bindings expose helpers that this package does not call directly.
	ignore: ['src/generated/**'],
	ignoreDependencies: [
		// Referenced through tsconfig.json's extends array.
		'@tsconfig/recommended',
		'@tsconfig/strictest',
		// Required by Vite+ as its Vite-compatible package alias.
		'vite',
	],
};

export default config;
