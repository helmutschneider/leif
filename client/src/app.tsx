import * as React from 'react'
import * as ReactDOM from 'react-dom'
import accounts from '../../accounts-2022.json'
import { formatDate, emptyVoucher, areDebitsAndCreditsBalanced, ensureHasEmptyTransaction, tryParseInt, getAccountName, formatSEK, calculateAccountBalances, ellipsis, getNextVoucherId } from './util';
import * as t from './types'
import { VoucherForm } from './voucher-form';

type Props = {}
type State = {
    search: string
    voucher: t.Voucher
    workbook: t.Workbook | undefined
}

const App: React.FC<Props> = props => {
    const [state, setState] = React.useState<State>({
        search: '',
        voucher: emptyVoucher(),
        workbook: {
            balances: {},
            name: 'Impossible Solution AB 2022',
            version: 1,
            vouchers: [
                {
                    ...emptyVoucher(),
                    id: 1,
                    name: 'Bankavgift',
                },
            ],
            year: 2022,
        },
    })

    const workbook = state.workbook

    if (!workbook) {
        return null
    }

    const balances = calculateAccountBalances(workbook.vouchers);
    const filteredVouchers = state.search === ''
        ? workbook.vouchers
        : workbook.vouchers.filter(voucher => {
            const json = JSON.stringify(voucher).toLowerCase();
            return json.includes(state.search.toLowerCase())
        });

    return (
        <div>
            <nav className="navbar navbar-dark bg-dark navbar-expand-lg">
                <div className="container">
                    <div className="navbar-brand d-flex align-items-center">
                        <img
                            src="leif.jpg"
                            style={{
                                borderRadius: 20,
                            }}
                            height={40}
                            title="Leif"
                        />
                    </div>
                    <div className="collapse navbar-collapse">
                        <input
                            className="form-control form-control-lg"
                            onChange={event => {
                                setState({
                                    ...state,
                                    search: event.target.value,
                                })
                            }}
                            placeholder={`Sök i ${workbook.name}`}
                            type="text"
                            value={state.search}
                        />
                    </div>
                </div>
            </nav>

            <div className="container pt-3">
                <div className="row">
                    <div className="col-8">
                        <h5>Verifikat</h5>
                        <table className="table table-sm">
                            <tbody>
                                {filteredVouchers.map((voucher, idx) => {
                                    return (
                                        <tr key={idx}>
                                            <td className="col-2">{voucher.date}</td>
                                            <td className="col-8">{voucher.name}</td>
                                            <td className="col-2">
                                                {voucher.attachments.map((attachment, idx) => {
                                                    return (
                                                        <span key={idx} title={attachment.name}>
                                                            <i className="bi bi-paperclip" />
                                                        </span>
                                                    )
                                                })}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="col">
                        <div className="mb-3">
                            <h5>Lägg till verifikat</h5>
                            <VoucherForm
                                onChange={next => {
                                    setState({
                                        ...state,
                                        voucher: next,
                                    })
                                }}
                                onOK={() => {
                                    const next: State = {
                                        search: '',
                                        voucher: emptyVoucher(),
                                        workbook: {
                                            ...workbook,
                                            vouchers: workbook.vouchers.concat({
                                                ...state.voucher,
                                                id: getNextVoucherId(workbook.vouchers),
                                            }),
                                        },
                                    }
                                    setState(next)
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
                                            <td className="text-end">{formatSEK(e[1])}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

const root = document.getElementById('app');
ReactDOM.render(<App />, root);
