import { S_BAR, S_BAR_END } from './constants.js';

export function treePrefix(element: string, index: number, list: unknown[]): string {
	return `${index + 1 === list.length ? S_BAR_END : S_BAR} ${element}`;
}
