import * as React from 'react'
import {Currency} from "./types";
import {formatIntegerAsMoneyDecimal, monetaryAmountToInteger, tryParseInt} from "./util";

type Props = {
    currency: Currency
    disabled?: boolean
    onChange: (value: number) => unknown
    placeholder?: string
    value: number | string
}

type State = {
    value: string
}

export const MoneyInput: React.FC<Props> = props => {
    const [state, setState] = React.useState<State>({
        value: formatIntegerAsMoneyDecimal(props.value, props.currency),
    });

    React.useEffect(() => {
        const parsed = tryParseInt(props.value, 0);
        const current = monetaryAmountToInteger(state.value, props.currency);

        // the value changed due to some outside factor. if the
        // prop change came from this component these values should
        // never differ.
        if (parsed !== current) {
            setState({
                value: formatIntegerAsMoneyDecimal(props.value, props.currency),
            });
        }

    }, [props.value]);

    const hasTooManyDecimalsPattern = new RegExp(`[,.]\\d{${props.currency.subunit + 1}}`)

    return (
        <div className="input-group">
            <input
                className="form-control"
                disabled={props.disabled}
                onChange={event => {
                    if (hasTooManyDecimalsPattern.test(event.target.value)) {
                        event.preventDefault()
                        event.stopPropagation()
                        return
                    }
                    const parsed = monetaryAmountToInteger(event.target.value, props.currency);
                    props.onChange(parsed);
                    setState({
                        value: event.target.value,
                    })
                }}
                placeholder={props.placeholder}
                type="text"
                value={state.value}
            />
            <span className="input-group-text">
                {props.currency.symbol}
            </span>
        </div>
    )
};
