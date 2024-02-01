import { name } from '@jonahsnider/util';
import { expect, test } from 'vitest';

import path from 'node:path';
import { PathEntryKind, type PathTree, flattenPathTree } from './paths.ts';

const mockProjectDir = path.join('/home', 'example-user', 'code', 'my-robot');
const pathsDir = path.join(mockProjectDir, 'src', 'main', 'deploy', 'pathplanner', 'paths');

const mockTree: PathTree = {
	kind: PathEntryKind.Tree,
	filepath: pathsDir,
	children: [
		{
			kind: PathEntryKind.Dir,
			name: 'Red',
			children: [],
			dirs: [],
			nameWithDirs: 'Red',
		},
		{
			kind: PathEntryKind.Dir,
			name: 'Blue',
			dirs: [],
			nameWithDirs: 'Blue',
			children: [
				{
					kind: PathEntryKind.Dir,
					name: 'Speaker',
					dirs: ['Blue'],
					nameWithDirs: 'Blue/Speaker',
					children: [
						{
							kind: PathEntryKind.File,
							name: 'BlueSpeakerNearIntake3',
							filepath: path.join(pathsDir, 'BlueSpeakerNearIntake3.json'),
							dirs: ['Blue', 'Speaker'],
							nameWithDirs: 'Blue/Speaker/BlueSpeakerNearIntake3',
						},
						{
							kind: PathEntryKind.File,
							name: 'BlueSpeakerNearIntake2',
							filepath: path.join(pathsDir, 'BlueSpeakerNearIntake2.json'),
							dirs: ['Blue', 'Speaker'],
							nameWithDirs: 'Blue/Speaker/BlueSpeakerNearIntake2',
						},
						{
							kind: PathEntryKind.File,
							name: 'BlueSpeakerNearIntake1',
							filepath: path.join(pathsDir, 'BlueSpeakerNearIntake1.json'),
							dirs: ['Blue', 'Speaker'],
							nameWithDirs: 'Blue/Speaker/BlueSpeakerNearIntake1',
						},
						{
							kind: PathEntryKind.File,
							name: 'BlueTest',
							filepath: path.join(pathsDir, 'BlueTest.json'),
							dirs: ['Blue'],
							nameWithDirs: 'Blue/BlueTest',
						},
					],
				},
			],
		},
	],
};

test(name(flattenPathTree), () => {
	const flattened = flattenPathTree(mockTree);

	expect(flattened).toMatchInlineSnapshot(`
		[
		  {
		    "children": [],
		    "dirs": [],
		    "kind": "dir",
		    "name": "Blue",
		  },
		  {
		    "children": [],
		    "dirs": [],
		    "kind": "dir",
		    "name": "Red",
		  },
		  {
		    "dirs": [
		      "Blue",
		    ],
		    "filepath": "/home/example-user/code/my-robot/src/main/deploy/pathplanner/paths/BlueTest.json",
		    "kind": "file",
		    "name": "BlueTest",
		  },
		  {
		    "children": [],
		    "dirs": [
		      "Blue",
		    ],
		    "kind": "dir",
		    "name": "Speaker",
		  },
		  {
		    "dirs": [
		      "Blue",
		      "Speaker",
		    ],
		    "filepath": "/home/example-user/code/my-robot/src/main/deploy/pathplanner/paths/BlueSpeakerNearIntake1.json",
		    "kind": "file",
		    "name": "BlueSpeakerNearIntake1",
		  },
		  {
		    "dirs": [
		      "Blue",
		      "Speaker",
		    ],
		    "filepath": "/home/example-user/code/my-robot/src/main/deploy/pathplanner/paths/BlueSpeakerNearIntake2.json",
		    "kind": "file",
		    "name": "BlueSpeakerNearIntake2",
		  },
		  {
		    "dirs": [
		      "Blue",
		      "Speaker",
		    ],
		    "filepath": "/home/example-user/code/my-robot/src/main/deploy/pathplanner/paths/BlueSpeakerNearIntake3.json",
		    "kind": "file",
		    "name": "BlueSpeakerNearIntake3",
		  },
		]
	`);
});
