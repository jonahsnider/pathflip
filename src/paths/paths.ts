import { Dirent } from 'node:fs';
import fs from 'node:fs/promises';
import { join } from 'node:path';
import { partition, settled } from '@jonahsnider/util';
import { Path, parsePathFromFile } from './path.js';

export enum PathEntryKind {
	File = 'file',
	Dir = 'dir',
	Tree = 'tree',
}

export type PathEntryFile = {
	kind: PathEntryKind.File;
	name: string;
	filepath: string;
	dir: string | undefined;
	nameWithDir: string;
	parsed: Path;
};

export type PathEntryDir = {
	kind: PathEntryKind.Dir;
	name: string;
	children: PathEntryFile[];
};

export type PathTree = {
	kind: PathEntryKind.Tree;
	children: Array<PathEntryFile | PathEntryDir>;
	filepath: string;
};

export type AnyPathEntry = PathEntryFile | PathEntryDir;

export const PATHS_DIR_MISSING = Symbol('PATHS_DIR_MISSING');
// biome-ignore lint/style/useNamingConvention: Naming this pascal case is less useful
export type PATHS_DIR_MISSING = typeof PATHS_DIR_MISSING;

async function getPathsDirEntries(
	projectDir: string,
): Promise<{ path: string; dirents: Dirent[] } | PATHS_DIR_MISSING> {
	const searchDirectories = [
		join(projectDir, 'src', 'main', 'deploy', 'pathplanner', 'paths'),
		join(projectDir, 'deploy', 'pathplanner', 'paths'),
	];

	for (const searchDir of searchDirectories) {
		const [pathsDirEntries, readdirError] = await settled<Error, Dirent[]>(
			fs.readdir(searchDir, { withFileTypes: true }),
		);

		if (readdirError) {
			// @ts-expect-error This is a custom error code
			if (readdirError.code === 'ENOENT') {
				continue;
			}

			throw readdirError;
		}

		return {
			path: searchDir,
			dirents: pathsDirEntries,
		};
	}

	return PATHS_DIR_MISSING;
}

export async function listPaths(projectDir: string): Promise<PathTree | PATHS_DIR_MISSING> {
	const pathsDirEntriesResult = await getPathsDirEntries(projectDir);

	if (pathsDirEntriesResult === PATHS_DIR_MISSING) {
		return PATHS_DIR_MISSING;
	}

	const { dirents: pathsDirEntries, path: pathsDir } = pathsDirEntriesResult;

	const dirs = new Map<string, PathEntryDir>();

	const pathTree: PathTree = {
		kind: PathEntryKind.Tree,
		filepath: pathsDir,
		children: [],
	};

	for (const file of pathsDirEntries) {
		if (!file.isFile()) {
			continue;
		}

		// Parse the path
		const path = await parsePathFromFile(join(pathsDir, file.name));

		const pathEntry: PathEntryFile = {
			filepath: join(file.path, file.name),
			kind: PathEntryKind.File,
			parsed: path,
			name: file.name.slice(0, -'.path'.length),
			nameWithDir: (path.folder ? `${path.folder}/` : '') + file.name.slice(0, -'.path'.length),
			dir: path.folder ?? undefined,
		};

		if (path.folder) {
			if (!dirs.has(path.folder)) {
				const dirEntry: PathEntryDir = {
					kind: PathEntryKind.Dir,
					name: path.folder,
					children: [],
				};

				dirs.set(path.folder, dirEntry);

				pathTree.children.push(dirEntry);
			}

			// biome-ignore lint/style/noNonNullAssertion: This is safe because of the check above
			const dir = dirs.get(path.folder)!;

			dir.children.push(pathEntry);
		} else {
			pathTree.children.push(pathEntry);
		}
	}

	return pathTree;
}

export function createPathEntryGuard<T extends PathEntryKind>(
	kind: T,
): (entry: AnyPathEntry | PathTree) => entry is typeof entry & { kind: T } {
	return (entry): entry is typeof entry & { kind: T } => entry.kind === kind;
}

export type FlattenedPathTree = Array<PathEntryFile | PathEntryDir>;

export function flattenPathTree(pathTree: PathTree): FlattenedPathTree {
	const flattened: FlattenedPathTree = [];

	const queue: Array<PathTree | PathEntryDir> = [pathTree];

	while (queue.length > 0) {
		const entry = queue.shift();
		if (entry === undefined) {
			throw new TypeError('Queue was empty');
		}

		const [files, dirs] = partition(entry.children, createPathEntryGuard(PathEntryKind.File));
		flattened.push(...files);
		queue.push(...dirs);

		if (entry.kind === PathEntryKind.Dir) {
			const { children: _, ...rest } = entry;
			flattened.push({ ...rest, children: [] });
		}
	}

	flattened.sort((a, b) => {
		const aName = a.kind === PathEntryKind.File ? a.nameWithDir : a.name;
		const bName = b.kind === PathEntryKind.File ? b.nameWithDir : b.name;

		return aName.localeCompare(bName);
	});

	return flattened;
}
