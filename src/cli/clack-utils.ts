export type MultiselectOption<T> = {
	value: T;
	label: string;
	hint?: string;
};
export type GroupMultiSelectOption<T> = MultiselectOption<T>[];
export type GroupMultiSelectOptions<T> = Record<string, GroupMultiSelectOption<T>>;
