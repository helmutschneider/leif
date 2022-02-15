import {tryParseInt} from "./util";

describe('tryParseInt tests', () => {
    const cases: ReadonlyArray<[string | number | undefined, unknown, unknown]> = [
        ['1', undefined, 1],
        ['', 42, 42],
        ['-15', undefined, -15],
        [undefined, 13, 13],
        [undefined, undefined, undefined],
    ];

    it.each(cases)('should parse correctly', (value, defaultValue, expected) => {
        const parsed = tryParseInt(value, defaultValue);
        expect(parsed).toBe(expected)
    });
});
