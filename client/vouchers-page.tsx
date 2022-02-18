import * as React from 'react'
import {VoucherForm} from "./voucher-form";
import {
    calculateAccountBalancesForYear,
    ellipsis,
    emptyVoucher,
    formatIntegerAsMoneyWithSeparatorsAndSymbol, objectContains,
    tryParseInt
} from "./util";
import {HttpSendFn} from "./http";
import * as t from "./types";
import {currencies, KeyCode} from "./types";

type Props = {
    http: HttpSendFn
    onWorkbookChanged: () => unknown
    search: string
    user: t.User
    workbook: t.Workbook
    year: number
}

type State = {
    openVoucherIds: ReadonlyArray<number>
    selectedVoucherId: number | undefined
    voucher: t.Voucher
}

function getNextStateFromKeydownEvent(event: KeyboardEvent, vouchers: ReadonlyArray<t.Voucher>, state: State): State | undefined {
    if (typeof state.selectedVoucherId === 'undefined') {
        return undefined;
    }

    switch (event.keyCode) {
        case KeyCode.ArrowDown: {
            event.preventDefault();
            event.stopPropagation();
            const voucherIndex = vouchers.findIndex(v => {
                return v.voucher_id === state.selectedVoucherId;
            });
            if (voucherIndex !== -1) {
                const nextIndex = (voucherIndex + 1) % vouchers.length;
                const nextId = vouchers[nextIndex]?.voucher_id;
                if (nextId) {
                    return {
                        ...state,
                        selectedVoucherId: nextId,
                    };
                }
            }
            return undefined;
        }
        case KeyCode.ArrowLeft: {
            event.preventDefault()
            event.stopPropagation();
            const next = state.openVoucherIds.slice();
            const index = next.indexOf(state.selectedVoucherId);
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
            if (!next.includes(state.selectedVoucherId)) {
                return {
                    ...state,
                    openVoucherIds: next.concat(state.selectedVoucherId),
                };
            }
            return undefined;
        }
        case KeyCode.ArrowUp: {
            event.preventDefault()
            event.stopPropagation();
            const voucherIndex = vouchers.findIndex(v => {
                return v.voucher_id === state.selectedVoucherId;
            });
            if (voucherIndex !== -1) {
                const nextIndex = voucherIndex === 0
                    ? (vouchers.length - 1)
                    : (voucherIndex - 1);
                const nextId = vouchers[nextIndex]?.voucher_id;
                if (nextId) {
                    return {
                        ...state,
                        selectedVoucherId: nextId,
                    };
                }
            }
            return undefined;
        }
    }

    return undefined;
}

export const VouchersPage: React.FC<Props> = props => {
    const [state, setState] = React.useState<State>({
        openVoucherIds: [],
        selectedVoucherId: undefined,
        voucher: emptyVoucher(),
    });

    const carryAccounts = props.workbook.carry_accounts
        .replace(/[^\d,]/g, '')
        .split(',')
        .map(num => tryParseInt(num, 0));
    const workbook = props.workbook
    const balances = calculateAccountBalancesForYear(
        workbook.vouchers, props.year, carryAccounts
    )
    const filteredVouchers: ReadonlyArray<t.Voucher> = workbook.vouchers.filter(voucher => {
        return (new Date(voucher.date)).getFullYear() === props.year
            && (props.search === '' || objectContains(voucher, props.search));
    });

    const isEditingVoucher = typeof state.voucher.voucher_id !== 'undefined';
    const editingVoucherId = state.voucher.voucher_id;
    const currency = currencies[props.workbook.currency];

    React.useEffect(() => {
        const documentClickListener = (event: MouseEvent) => {
            setState(prev => {
                return {
                    ...prev,
                    selectedVoucherId: undefined,
                };
            });
        };
        const documentKeyDownListener = (event: KeyboardEvent) => {
            const next = getNextStateFromKeydownEvent(event, filteredVouchers, state);
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
    }, [state.openVoucherIds, state.selectedVoucherId]);

    React.useEffect(() => {
        setState(prev => {
            return {
                ...prev,
                openVoucherIds: [],
                selectedVoucherId: undefined,
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
                        const isVoucherOpen = state.openVoucherIds.find(item => {
                            return item === voucher.voucher_id;
                        });
                        const isVoucherOpenIconClass = isVoucherOpen
                            ? 'bi-caret-down-fill'
                            : 'bi-caret-right-fill';

                        const maybeOpenVoucherStuff = isVoucherOpen
                            ? (
                                <tr>
                                    <td/>
                                    <td>
                                        {voucher.transactions.map((item, k) => {
                                            return (
                                                <div className="row" key={k}>
                                                    <div className="col-6">{item.account}</div>
                                                    <div className="col-6 text-end">
                                                        {formatIntegerAsMoneyWithSeparatorsAndSymbol(
                                                            item.kind === 'credit'
                                                                ? ('-' + item.amount)
                                                                : item.amount,
                                                            currency
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </td>
                                    <td/>
                                </tr>
                            )
                            : null

                        return (
                            <React.Fragment key={idx}>
                                <tr
                                    className={
                                        state.selectedVoucherId === voucher.voucher_id
                                            ? 'table-primary'
                                            : undefined
                                    }
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
                                            selectedVoucherId: voucher.voucher_id,
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
                                            selectedVoucherId: voucherId,
                                            voucher: state.voucher,
                                        });
                                    }}
                                    role="button"
                                >
                                    <td className="col-2">
                                        <i
                                            className={`bi ${isVoucherOpenIconClass} me-3`}
                                        />
                                        {voucher.date}
                                    </td>
                                    <td className="col-8">{voucher.name}</td>
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
                                                        selectedVoucherId: undefined,
                                                        voucher: emptyVoucher(),
                                                    })
                                                } else {
                                                    setState({
                                                        openVoucherIds: state.openVoucherIds,
                                                        selectedVoucherId: undefined,
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
                                                        selectedVoucherId: undefined,

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
                                        selectedVoucherId: undefined,
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
                                selectedVoucherId: undefined,
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
                                    selectedVoucherId: undefined,
                                    voucher: emptyVoucher(),
                                });
                            })
                        }}
                        templates={props.workbook.templates}
                        voucher={state.voucher}
                    />
                </div>
                <h5>Kontobalans</h5>
                <table className="table table-sm">
                    <tbody>
                    {Object.entries(balances).map((e, idx) => {
                        const accountName = props.workbook.accounts[e[0]] ?? '';
                        return (
                            <tr key={idx}>
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
