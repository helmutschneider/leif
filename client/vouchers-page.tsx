import * as React from 'react'
import {VoucherForm} from "./voucher-form";
import {
    calculateAccountBalances,
    ellipsis,
    emptyVoucher,
    formatIntegerAsMoneyWithSeparatorsAndSymbol,
    tryParseInt
} from "./util";
import {HttpBackend} from "./http";
import * as t from "./types";

type Props = {
    accounts: t.AccountPlan
    currency: t.Currency
    http: HttpBackend
    onChange: (next: t.Workbook) => unknown
    search: string
    user: t.User
    workbook: t.Workbook
}

type State = {
    openVoucherIds: ReadonlyArray<number>
    voucher: t.Voucher
}

export const VouchersPage: React.FC<Props> = props => {
    const [state, setState] = React.useState<State>({
        openVoucherIds: [],
        voucher: emptyVoucher(),
    });

    const workbook = props.workbook
    const balances = calculateAccountBalances(workbook.vouchers, workbook.account_carries);
    const filteredVouchers: ReadonlyArray<t.Voucher> = props.search === ''
        ? workbook.vouchers
        : workbook.vouchers.filter(voucher => {
            const json = JSON.stringify(voucher).toLowerCase();
            return json.includes(props.search.toLowerCase())
        });

    const isEditingVoucher = typeof state.voucher.voucher_id !== 'undefined';
    const editingVoucherId = tryParseInt(state.voucher.voucher_id, undefined);

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
                <table className="table table-sm table-hover">
                    <tbody>
                    {filteredVouchers.map((voucher, idx) => {
                        const isVoucherOpen = state.openVoucherIds.find(item => {
                            return item === tryParseInt(voucher.voucher_id, undefined);
                        });
                        const isVoucherOpenIconClass = isVoucherOpen
                            ? 'bi-caret-down-fill'
                            : 'bi-caret-right-fill';

                        const maybeOpenVoucherStuff = isVoucherOpen
                            ? (
                                <tr>
                                    <td />
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
                                                            props.currency
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </td>
                                    <td />
                                </tr>
                            )
                            : null

                        return (
                            <React.Fragment key={idx}>
                                <tr
                                    onClick={event => {
                                        event.preventDefault()
                                        event.stopPropagation()

                                        const parsedId = tryParseInt(voucher.voucher_id, undefined);

                                        if (typeof parsedId === 'undefined') {
                                            return;
                                        }

                                        const indexOfId = state.openVoucherIds.indexOf(parsedId);
                                        const next = state.openVoucherIds.slice()

                                        if (indexOfId === -1) {
                                            next.push(parsedId);
                                        } else {
                                            next.splice(indexOfId, 1);
                                        }

                                        setState({
                                            openVoucherIds: next,
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

                                                if (isEditingVoucher && editingVoucherId === tryParseInt(voucher.voucher_id, undefined)) {
                                                    // we were already editing this exact voucher.
                                                    // stop editing instead.
                                                    setState({
                                                        openVoucherIds: state.openVoucherIds,
                                                        voucher: emptyVoucher(),
                                                    })
                                                } else {
                                                    setState({
                                                        openVoucherIds: state.openVoucherIds,
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

                                                props.http.send({
                                                    method: 'DELETE',
                                                    url: `/api/voucher/${voucher.voucher_id}`,
                                                }).then(res => {
                                                    const next = workbook.vouchers.slice()
                                                    next.splice(idx, 1);
                                                    props.onChange({
                                                        ...workbook,
                                                        vouchers: next,
                                                    });
                                                    setState({
                                                        openVoucherIds: state.openVoucherIds,

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
                            {
                                isEditingVoucher
                                    ? (
                                        <i
                                            className="bi bi-x-circle-fill"
                                            onClick={event => {
                                                event.preventDefault();
                                                event.stopPropagation();

                                                setState({
                                                    openVoucherIds: state.openVoucherIds,
                                                    voucher: emptyVoucher(),
                                                })
                                            }}
                                            title="Avbryt redigering"
                                            role="button"
                                        />
                                    )
                                    : null
                            }
                        </span>
                        </div>
                    </div>

                    <VoucherForm
                        accounts={props.accounts}
                        currency={props.currency}
                        onChange={next => {
                            setState({
                                openVoucherIds: state.openVoucherIds,
                                voucher: next,
                            });
                        }}
                        onOK={() => {
                            const body: t.Voucher = {
                                ...state.voucher,
                                transactions: state.voucher.transactions.filter(t => {
                                    return t.amount !== 0
                                }),
                                workbook_id: workbook.workbook_id!,
                            };

                            props.http.send<t.Voucher>({
                                method: isEditingVoucher ? 'PUT' : 'POST',
                                url: isEditingVoucher
                                    ? `/api/voucher/${editingVoucherId}`
                                    : '/api/voucher',
                                body: body,
                            }).then(res => {
                                const next = workbook.vouchers.slice()

                                if (isEditingVoucher) {
                                    const idx = next.findIndex(item => {
                                        return typeof editingVoucherId !== 'undefined'
                                            && editingVoucherId === tryParseInt(item.voucher_id, undefined);
                                    })
                                    if (idx !== -1) {
                                        next[idx] = res;
                                    }
                                } else {
                                    next.push(res)
                                }

                                props.onChange({
                                    ...workbook,
                                    vouchers: next,
                                })
                                setState({
                                    openVoucherIds: state.openVoucherIds,
                                    voucher: emptyVoucher(),
                                })
                            })
                        }}
                        voucher={state.voucher}
                    />
                </div>
                <h5>Kontobalans</h5>
                <table className="table table-sm">
                    <tbody>
                    {Object.entries(balances).map((e, idx) => {
                        const accountName = props.accounts[e[0]] ?? '';
                        return (
                            <tr key={idx}>
                                <td>{e[0]}</td>
                                <td>
                                    <span title={accountName}>
                                        {ellipsis(accountName, 30)}
                                    </span>
                                </td>
                                <td className="text-end">{formatIntegerAsMoneyWithSeparatorsAndSymbol(e[1], props.currency)}</td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    )
};
