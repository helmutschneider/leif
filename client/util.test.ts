import {
    calculateAccountBalancesForYear,
    findYearOfMostRecentlyEditedVoucher,
    formatDate, formatIntegerAsMoneyDecimal, monetaryAmountToInteger,
    objectContains,
    tryParseInt
} from "./util";
import {currencies, Voucher} from "./types";

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

describe('calculateAccountBalancesForYear tests', () => {
    const vouchers: ReadonlyArray<Voucher> = [
        {
            attachments: [],
            created_at: '',
            date: '2022-02-17',
            is_template: false,
            name: '',
            notes: '',
            transactions: [
                {
                    account: 1510,
                    amount: 100,
                    kind: 'credit',
                },
                {
                    account: 1910,
                    amount: 100,
                    kind: 'debit',
                },
            ],
            updated_at: '',
        },
        {
            attachments: [],
            created_at: '',
            date: '2023-03-01',
            is_template: false,
            name: '',
            notes: '',
            transactions: [
                {
                    account: 1510,
                    amount: 250,
                    kind: 'credit',
                },
                {
                    account: 1910,
                    amount: 250,
                    kind: 'debit',
                },
            ],
            updated_at: '',
        },
        {
            attachments: [],
            created_at: '',
            date: '2024-03-01',
            is_template: false,
            name: '',
            notes: '',
            transactions: [
                {
                    account: 1510,
                    amount: 500,
                    kind: 'credit',
                },
                {
                    account: 1910,
                    amount: 500,
                    kind: 'debit',
                },
            ],
            updated_at: '',
        },
    ];

    it('should handle simple case without carry', () => {
        const result = calculateAccountBalancesForYear(vouchers, 2022, []);
        expect(result).toEqual({
            1510: -100,
            1910: 100,
        });
    });

    it('should include previous years when carrying', () => {
        const result = calculateAccountBalancesForYear(vouchers, 2023, [1510, 1910]);
        expect(result).toEqual({
            1510: -350,
            1910: 350,
        });
    });
});

describe('objectContains tests', () => {
    const cases: ReadonlyArray<[unknown, string, boolean]> = [
        [{}, 'yee', false],
        ['yeee', 'yee', true],
        [{name: 'Kanye'}, 'ye', true],
        [['Kanye'], 'ye', true],
        [null, 'nul', false],
        [undefined, 'undef', false],
    ];

    it.each(cases)('should find the thing', (value, search, expected) => {
        const result = objectContains(value, search);
        expect(result).toBe(expected);
    });
});

describe('formatIntegerAsMoneyDecimal tests', () => {
    const cases: ReadonlyArray<[number, string]> = [
        [0, '0,00'],
        [100, '1,00'],
        [-100, '-1,00'],
        [1500, '15,00'],
    ];
    it.each(cases)('should format correctly', (value, expected) => {
        const result = formatIntegerAsMoneyDecimal(value, currencies.SEK);
        expect(result).toBe(expected);
    });
});

describe('monetaryAmountToInteger tests', () => {
    const cases: ReadonlyArray<[string, number]> = [
        ['15,00', 1500],
        ['15.00', 1500],
        ['-15.00', -1500],
        ['   22,00  ', 2200],
        ['   -23.00  ', -2300],
    ];

    it.each(cases)('should parse the amount correctly', (value, expected) => {
        const result = monetaryAmountToInteger(value, currencies.SEK);
        expect(result).toBe(expected);
    });
});
