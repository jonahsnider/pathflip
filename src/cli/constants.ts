import isUnicodeSupported from 'is-unicode-supported';

const unicode = isUnicodeSupported();
const s = (c: string, fallback: string) => (unicode ? c : fallback);

export const S_BAR = s('│', '|');
export const S_BAR_END = s('└', '—');
