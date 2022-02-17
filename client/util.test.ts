import {findIdOfMostRecentlyEditedWorkbook, formatDate, tryParseInt} from "./util";

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
        const result = findIdOfMostRecentlyEditedWorkbook([]);
        expect(result).toBeUndefined()
    })

    it('should return an ID when the workbook does not have any vouchers', () => {
        const result = findIdOfMostRecentlyEditedWorkbook([
            {
                account_carries: [],
                name: 'My dude',
                vouchers: [],
                workbook_id: 1,
                year: 2022,
            },
        ]);
        expect(result).toBe(1);
    });

    it('should find the most recently edited workbook by looking at the vouchers', () => {
        const result = findIdOfMostRecentlyEditedWorkbook([
            {
                account_carries: [],
                name: 'My dude',
                vouchers: [
                    {
                        attachments: [],
                        created_at: '2022-02-12T00:00:00Z',
                        date: '',
                        name: '',
                        transactions: [],
                    },
                ],
                workbook_id: 1,
                year: 2022,
            },
            {
                account_carries: [],
                name: 'My dude again',
                vouchers: [
                    {
                        attachments: [],
                        created_at: '2022-02-17T00:00:00Z',
                        date: '',
                        name: '',
                        transactions: [],
                    },
                ],
                workbook_id: 2,
                year: 2021,
            },
        ]);
        expect(result).toBe(2);
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
