import * as React from 'react'
import {VoucherForm} from "./voucher-form";
import {
    calculateAccountBalancesForYear,
    ellipsis,
    emptyVoucher,
    formatIntegerAsMoneyWithSeparatorsAndSymbol, isFuture, objectContains, parseDate, sumOfTransactions,
    tryParseInt
} from "./util";
import {HttpSendFn} from "./http";
import * as t from "./types";
import {currencies, KeyCode} from "./types";

type Selection =
    | { kind: 'none' }
    | { kind: 'account', accountNumber: number }
    | { kind: 'voucher', voucherId: number }

type Props = {
    http: HttpSendFn
    onWorkbookChanged: () => unknown
    search: string
    today: string
    user: t.User
    workbook: t.Workbook
    year: number
}

type State = {
    openVoucherIds: ReadonlyArray<number>
    selection: Selection
    voucher: t.Voucher
}

function getNextIndexFromKeyboardEvent<T>(event: KeyboardEvent, values: ReadonlyArray<T>, current: T | undefined): number | undefined {
    if (typeof current === 'undefined') {
        return values.length ? 0 : undefined
    }

    switch (event.keyCode) {
        case KeyCode.ArrowDown: {
            const indexOfCurrentValue = values.indexOf(current);
            if (indexOfCurrentValue !== -1) {
                return (indexOfCurrentValue + 1) % values.length;
            }
            return undefined;
        }
        case KeyCode.ArrowUp: {
            const indexOfCurrentValue = values.indexOf(current);
            if (indexOfCurrentValue !== -1) {
                return indexOfCurrentValue === 0
                    ? (values.length - 1)
                    : (indexOfCurrentValue - 1);
            }
            return undefined;
        }
    }

    return undefined;
}

function getNextStateFromKeydownEvent(event: KeyboardEvent, vouchers: ReadonlyArray<t.Voucher>, balances: t.AccountBalanceMap, state: State): State | undefined {
    const selection = state.selection;

    if (selection.kind === 'none') {
        return undefined;
    }

    switch (selection.kind) {
        case 'account': {
            switch (event.keyCode) {
                case KeyCode.ArrowUp:
                case KeyCode.ArrowDown:
                    event.preventDefault();
                    event.stopPropagation();

                    const accountNumbers = Object.keys(balances).map(item => tryParseInt(item, 0));
                    const nextIndex = getNextIndexFromKeyboardEvent(event, accountNumbers, selection.accountNumber);

                    if (typeof nextIndex !== 'undefined') {
                        const nextAccountNumber = accountNumbers[nextIndex];

                        return {
                            ...state,
                            selection: {
                                kind: 'account',
                                accountNumber: nextAccountNumber!,
                            },
                        };
                    }

                    break;
            }
            return undefined;
        }
        case 'voucher': {
            switch (event.keyCode) {
                case KeyCode.ArrowUp:
                case KeyCode.ArrowDown: {
                    event.preventDefault();
                    event.stopPropagation();

                    const selectedVoucher = vouchers.find(v => v.voucher_id === selection.voucherId);
                    const nextIndex = getNextIndexFromKeyboardEvent(event, vouchers, selectedVoucher);

                    if (typeof nextIndex !== 'undefined') {
                        const voucher = vouchers[nextIndex];

                        return {
                            ...state,
                            selection: {
                                kind: 'voucher',
                                voucherId: voucher?.voucher_id!,
                            },
                        };
                    }

                    return undefined;
                }
                case KeyCode.ArrowLeft: {
                    event.preventDefault()
                    event.stopPropagation();
                    const next = state.openVoucherIds.slice();
                    const index = next.indexOf(selection.voucherId);
                    if (index !== -1) {
                        next.splice(index, 1);
                        return {
                            ...state,
                            openVoucherIds: next,
                        };
                    }
                    return undefined;
                }
                case KeyCode.ArrowRight: {
                    event.preventDefault()
                    event.stopPropagation();
                    const next = state.openVoucherIds.slice();
                    if (!next.includes(selection.voucherId)) {
                        return {
                            ...state,
                            openVoucherIds: next.concat(selection.voucherId),
                        };
                    }
                    return undefined;
                }
            }
        }
    }

    return undefined;
}

function findTransactionsWhereAccountMatches(transactions: ReadonlyArray<t.Transaction>, pattern: RegExp): ReadonlyArray<t.Transaction> {
    return transactions.filter(tr => pattern.test(String(tr.account)));
}

function maybeMakeAmountRed(amount: string | number): React.ReactNode {
    const str = String(amount);

    // Unicode Character 'MINUS SIGN' (U+2212)
    // https://www.fileformat.info/info/unicode/char/2212/index.htm
    //
    // Intl.NumberFormat likes to give us this character.
    if (/^[-\u2212]/.test(str)) {
        return (
            <span className="text-danger">{str}</span>
        )
    }
    return str;
}

export const VouchersPage: React.FC<Props> = props => {
    const [state, setState] = React.useState<State>({
        openVoucherIds: [],
        selection: { kind: 'none' },
        voucher: emptyVoucher(),
    });

    const carryAccounts = props.workbook.carry_accounts
        .replace(/[^\d,]/g, '')
        .split(',')
        .map(num => tryParseInt(num, 0));
    const workbook = props.workbook
    const balances = calculateAccountBalancesForYear(
        workbook.vouchers, props.year, props.today, carryAccounts
    )
    const filteredVouchers: ReadonlyArray<t.Voucher> = workbook.vouchers.filter(voucher => {
        return (new Date(voucher.date)).getFullYear() === props.year
            && (props.search === '' || objectContains(voucher, props.search));
    });

    const isEditingVoucher = typeof state.voucher.voucher_id !== 'undefined';
    const editingVoucherId = state.voucher.voucher_id;
    const currency = currencies[props.workbook.currency];
    const todayAsDate = parseDate(props.today, 'yyyy-MM-dd')!;

    React.useEffect(() => {
        const documentClickListener = (event: MouseEvent) => {
            setState(prev => {
                return {
                    ...prev,
                    selection: { kind: 'none' },
                };
            });
        };
        const documentKeyDownListener = (event: KeyboardEvent) => {
            const next = getNextStateFromKeydownEvent(event, filteredVouchers, balances, state);
            if (typeof next !== 'undefined') {
                setState(next);
            }
        };
        document.addEventListener('click', documentClickListener);
        document.addEventListener('keydown', documentKeyDownListener);
        return () => {
            document.removeEventListener('click', documentClickListener);
            document.removeEventListener('keydown', documentKeyDownListener);
        };
    }, [state.openVoucherIds, state.selection]);

    React.useEffect(() => {
        setState(prev => {
            return {
                ...prev,
                openVoucherIds: [],
                selection: { kind: 'none' },
            };
        })
    }, [props.search]);

    return (
        <div className="row">
            <div className="col-lg-8">
                <h5>
                    Verifikat
                    {
                        props.search !== ''
                            ? ` (${filteredVouchers.length} resultat)`
                            : ''
                    }
                </h5>
                <table className="table table-sm">
                    <tbody>
                    {filteredVouchers.map((voucher, idx) => {
                        const isVoucherOpen = state.openVoucherIds.some(item => {
                            return item === voucher.voucher_id;
                        });
                        const isVoucherOpenIconClass = isVoucherOpen
                            ? 'bi-caret-down-fill'
                            : 'bi-caret-right-fill';

                        const maybeOpenVoucherStuff = isVoucherOpen
                            ? (
                                <tr>
                                    <td/>
                                    <td colSpan={2}>
                                        {voucher.transactions.map((item, k) => {
                                            const formattedAmount = formatIntegerAsMoneyWithSeparatorsAndSymbol(
                                                item.kind === 'credit'
                                                    ? ('-' + item.amount)
                                                    : item.amount,
                                                currency
                                            );
                                            return (
                                                <div className="row" key={k}>
                                                    <div className="col-6">{item.account}</div>
                                                    <div className="col-6 text-end">
                                                        {maybeMakeAmountRed(formattedAmount)}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </td>
                                    <td/>
                                </tr>
                            )
                            : null

                        const transactionsFromCheckingAccounts = findTransactionsWhereAccountMatches(
                            voucher.transactions, /^191/
                        );
                        const sumOfCheckingAccounts = sumOfTransactions(transactionsFromCheckingAccounts);

                        const selection = state.selection
                        let rowClassName = '';

                        if (selection.kind === 'voucher' && selection.voucherId === voucher.voucher_id) {
                            rowClassName = 'table-primary';
                        } else if (selection.kind === 'account' && voucher.transactions.some(t => t.account === selection.accountNumber)) {
                            rowClassName = 'table-secondary';
                        }

                        const next = filteredVouchers?.[idx + 1];
                        const isLastVoucherInTheFuture = typeof next !== 'undefined'
                            && isFuture(parseDate(voucher.date, 'yyyy-MM-dd')!, todayAsDate)
                            && !isFuture(parseDate(next.date, 'yyyy-MM-dd')!, todayAsDate);

                        const style: React.CSSProperties = {};

                        if (isLastVoucherInTheFuture) {
                            rowClassName += ' border-dark';
                            style.borderBottom = '3px solid';
                        }

                        return (
                            <React.Fragment key={idx}>
                                <tr
                                    className={rowClassName}
                                    onMouseDown={event => {
                                        // prevent selection by double click. various places online
                                        // suggest invoking "preventDefault()" unconditionally which
                                        // of course breaks selection by dragging. the detail-property
                                        // seems to indicate how many times the element was clicked.
                                        //
                                        // https://stackoverflow.com/a/43321596
                                        if (event.detail > 1) {
                                            event.preventDefault();
                                        }
                                    }}
                                    onClick={event => {
                                        event.preventDefault();
                                        event.stopPropagation();

                                        setState({
                                            ...state,
                                            selection: {
                                                kind: 'voucher',
                                                voucherId: voucher.voucher_id!,
                                            },
                                        });
                                    }}
                                    onDoubleClick={event => {
                                        event.preventDefault();
                                        event.stopPropagation();

                                        const voucherId = voucher.voucher_id;

                                        if (typeof voucherId === 'undefined') {
                                            return;
                                        }

                                        const indexOfId = state.openVoucherIds.indexOf(voucherId);
                                        const next = state.openVoucherIds.slice();

                                        if (indexOfId === -1) {
                                            next.push(voucherId);
                                        } else {
                                            next.splice(indexOfId, 1);
                                        }

                                        setState({
                                            openVoucherIds: next,
                                            selection: {
                                                kind: 'voucher',
                                                voucherId: voucher.voucher_id!,
                                            },
                                            voucher: state.voucher,
                                        });
                                    }}
                                    role="button"
                                    style={style}
                                >
                                    <td className="col-2">
                                        <i
                                            className={`bi ${isVoucherOpenIconClass} me-3`}
                                        />
                                        {voucher.date}
                                    </td>
                                    <td className="col-6">{voucher.name}</td>
                                    <td className="col-2 text-end">
                                        {
                                            sumOfCheckingAccounts !== 0 && !isVoucherOpen
                                                ? maybeMakeAmountRed(
                                                    formatIntegerAsMoneyWithSeparatorsAndSymbol(sumOfCheckingAccounts, currency)
                                                )
                                                : undefined
                                        }
                                    </td>
                                    <td className="col-2 text-end">
                                        {voucher.attachments.map((attachment, idx) => {
                                            return (
                                                <i
                                                    key={idx}
                                                    className="bi bi-file-earmark-fill me-1"
                                                    title={attachment.name}
                                                    onClick={event => {
                                                        event.preventDefault()
                                                        event.stopPropagation()

                                                        window.open(
                                                            `/api/attachment/${attachment.attachment_id}?token=${props.user.token}`,
                                                            '_blank'
                                                        );
                                                    }}
                                                    role="button"
                                                />
                                            )
                                        })}
                                        <i
                                            className="bi bi-gear-fill me-1"
                                            onClick={event => {
                                                event.preventDefault();
                                                event.stopPropagation();

                                                if (isEditingVoucher && editingVoucherId === voucher.voucher_id) {
                                                    // we were already editing this exact voucher.
                                                    // stop editing instead.
                                                    setState({
                                                        openVoucherIds: state.openVoucherIds,
                                                        selection: { kind: 'none' },
                                                        voucher: emptyVoucher(),
                                                    })
                                                } else {
                                                    setState({
                                                        openVoucherIds: state.openVoucherIds,
                                                        selection: { kind: 'none' },
                                                        voucher: voucher,
                                                    })
                                                }
                                            }}
                                            title="Redigera"
                                            role="button"
                                        />
                                        <i
                                            className="bi bi-x-circle-fill"
                                            onClick={event => {
                                                event.preventDefault();
                                                event.stopPropagation();

                                                if (!confirm('Ta bort verifikat?')) {
                                                    return;
                                                }

                                                props.http({
                                                    method: 'DELETE',
                                                    url: `/api/voucher/${voucher.voucher_id}`,
                                                }).then(res => {
                                                    props.onWorkbookChanged();
                                                    setState({
                                                        openVoucherIds: state.openVoucherIds,
                                                        selection: { kind: 'none' },
                                                        // if we had accidentally clicked the "edit" button
                                                        // before deleting the voucher it would still be in
                                                        // state, which is kinda weird.
                                                        voucher: emptyVoucher(),
                                                    });
                                                })
                                            }}
                                            title="Ta bort"
                                            role="button"
                                        />
                                    </td>
                                </tr>
                                {maybeOpenVoucherStuff}
                            </React.Fragment>
                        )
                    })}
                    </tbody>
                </table>
            </div>
            <div className="col-lg-4">
                <div className="mb-3">
                    <div className="row">
                        <div className="col">
                            <h5>
                                {isEditingVoucher ? 'Redigera verifikat' : 'Lägg till verifikat'}
                            </h5>
                        </div>
                        <div className="col-md-auto">
                        <span>
                            <i
                                className="bi bi-x-circle-fill"
                                onClick={event => {
                                    event.preventDefault();
                                    event.stopPropagation();

                                    setState({
                                        openVoucherIds: state.openVoucherIds,
                                        selection: { kind: 'none' },
                                        voucher: emptyVoucher(),
                                    });
                                }}
                                title="Avbryt"
                                role="button"
                            />
                        </span>
                        </div>
                    </div>

                    <VoucherForm
                        accounts={props.workbook.accounts}
                        currency={currency}
                        onChange={next => {
                            setState({
                                openVoucherIds: state.openVoucherIds,
                                selection: { kind: 'none' },
                                voucher: next,
                            });
                        }}
                        onOK={() => {
                            const body: t.Voucher = {
                                ...state.voucher,
                                transactions: state.voucher.transactions.filter(t => {
                                    return t.amount !== 0
                                }),
                            };

                            props.http<t.Voucher>({
                                method: isEditingVoucher ? 'PUT' : 'POST',
                                url: isEditingVoucher
                                    ? `/api/voucher/${editingVoucherId}`
                                    : '/api/voucher',
                                body: body,
                            }).then(res => {
                                props.onWorkbookChanged();
                                setState({
                                    openVoucherIds: state.openVoucherIds,
                                    selection: { kind: 'none' },
                                    voucher: emptyVoucher(),
                                });
                            })
                        }}
                        templates={props.workbook.templates}
                        voucher={state.voucher}
                    />
                </div>
                <h5>Kontobalans ({props.today})</h5>
                <table className="table table-sm">
                    <tbody>
                    {Object.entries(balances).map((e, idx) => {
                        const accountNumber = tryParseInt(e[0], 0);
                        const accountName = props.workbook.accounts[accountNumber] ?? '';

                        return (
                            <tr
                                className={
                                    state.selection.kind === 'account'
                                        && state.selection.accountNumber === accountNumber
                                        ? 'table-primary'
                                        : undefined
                                }
                                key={idx}
                                onClick={event => {
                                    event.preventDefault()
                                    event.stopPropagation()

                                    setState({
                                        ...state,
                                        selection: {
                                            kind: 'account',
                                            accountNumber: accountNumber,
                                        },
                                    });
                                }}
                                role="button"
                            >
                                <td>{e[0]}</td>
                                <td>
                                    <span title={accountName}>
                                        {ellipsis(accountName, 30)}
                                    </span>
                                </td>
                                <td className="text-end">
                                    {formatIntegerAsMoneyWithSeparatorsAndSymbol(e[1], currency)}
                                </td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    )
};
