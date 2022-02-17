import {findYearOfMostRecentlyEditedVoucher, formatDate, tryParseInt} from "./util";

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

describe('findIdOfMostRecentlyEditedWorkbook tests', () => {
    it('should return undefined with no workbooks', () => {
        const result = findYearOfMostRecentlyEditedVoucher({
            accounts: {},
            carry_accounts: '',
            currency: 'SEK',
            templates: [],
            vouchers: [],
        });
        expect(result).toBeUndefined()
    })

    it('should find the most recently edited workbook by looking at the vouchers', () => {
        const result = findYearOfMostRecentlyEditedVoucher({
            accounts: {},
            carry_accounts: '',
            currency: 'SEK',
            templates: [],
            vouchers: [
                {
                    attachments: [],
                    created_at: '',
                    date: '2021-01-01',
                    is_template: false,
                    name: '',
                    notes: '',
                    transactions: [],
                    updated_at: '2022-02-12T00:00:00Z',
                },
                {
                    attachments: [],
                    created_at: '',
                    date: '2023-02-17',
                    is_template: false,
                    name: '',
                    notes: '',
                    transactions: [],
                    updated_at: '2022-02-17T00:00:00Z',
                },
            ],
        });
        expect(result).toBe(2023);
    });
});

describe('formatDate tests', () => {
    const cases: ReadonlyArray<[string, Date, string]> = [
        ['yyyy-MM-dd', new Date(2021, 0, 15), '2021-01-15'],
        ['yyyy', new Date(2021, 0, 15), '2021'],
        ['MM', new Date(2021, 0, 15), '01'],
        ['dd', new Date(2021, 0, 15), '15'],
        ['yyyy-yyyy-yyyy', new Date(2021, 0, 15), '2021-2021-2021'],
    ]

    it.each(cases)('should format correctly', (format, date, expected) => {
        const result = formatDate(date, format);
        expect(result).toBe(expected);
    });
});
