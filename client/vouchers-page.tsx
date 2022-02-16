import * as React from 'react'
import {VoucherForm} from "./voucher-form";
import {
    calculateAccountBalances,
    ellipsis,
    emptyVoucher,
    formatAsMonetaryAmount,
    getAccountName, tryParseInt
} from "./util";
import {HttpBackend} from "./http";
import * as t from "./types";

type Props = {
    currency: t.Currency
    http: HttpBackend
    onChange: (next: t.Workbook) => unknown
    search: string
    user: t.User
    workbook: t.Workbook
}

export const VouchersPage: React.FC<Props> = props => {
    const [state, setState] = React.useState({
        voucher: emptyVoucher(),
    });

    const workbook = props.workbook
    const balances = calculateAccountBalances(workbook.vouchers, workbook.balance_carry);
    let filteredVouchers: Array<t.Voucher> = props.search === ''
        ? workbook.vouchers.slice()
        : workbook.vouchers.filter(voucher => {
            const json = JSON.stringify(voucher).toLowerCase();
            return json.includes(props.search.toLowerCase())
        });

    const comparator = new Intl.Collator('sv', {
        numeric: true,
    })

    // sort descending by the date and creation date.
    // the date has priority.
    filteredVouchers.sort((a, b) => {
        return (comparator.compare(b.date, a.date) << 8)
            + (comparator.compare(b.created_at, a.created_at));
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
                <table className="table table-sm">
                    <tbody>
                    {filteredVouchers.map((voucher, idx) => {
                        return (
                            <tr key={idx}>
                                <td className="col-2">{voucher.date}</td>
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

                                            setState({
                                                voucher: voucher,
                                            })
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
                        currency={props.currency}
                        onChange={next => {
                            setState({
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
                        const accountName = getAccountName(e[0]);
                        return (
                            <tr key={idx}>
                                <td>{e[0]}</td>
                                <td>
                                                <span title={accountName}>
                                                    {ellipsis(accountName, 30)}
                                                </span>
                                </td>
                                <td className="text-end">{formatAsMonetaryAmount(e[1], props.currency)}</td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    )
};
