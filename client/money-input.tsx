import * as React from 'react';
import { Currency } from "./types";
import { formatIntegerAsMoneyDecimal, monetaryAmountToInteger, tryParseFloat } from "./util";

type NumberParser = {
  format: (value: string | number) => string;

  /**
   * Attempt to parse a new value from the 'onChange' event.
   * Returning 'undefined' instructs the input to do nothing
   * and ignore the key stroke.
   */
  parse: (value: string | number) => number | undefined;
}
type NumberInputProps = {
  disabled?: boolean
  onChange: (value: number) => unknown
  parser: NumberParser;
  placeholder?: string
  tabIndex?: number
  value: number | string
}

export const NUMBER_INPUT_DEFAULT_PARSER: NumberParser = {
  format: (value) => {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
      return '';
    }
    return value.toString();
  },
  parse: (value) => {
    if (typeof value === 'number') {
      if (Number.isNaN(value) || !Number.isFinite(value)) {
        return undefined;
      }
      return value;
    }

    if (value === '') {
      return 0;
    }

    const withDotAsDecimalSeparator = value
      .replace(/[^-\d,.]/g, '')
      .replace(/[.,]$/g, '')
      .replace(/,(\d+)$/g, '.$1');

    return tryParseFloat(withDotAsDecimalSeparator, undefined);
  },
};
export const NumberInput: React.FC<NumberInputProps> = props => {
  const [displayValue, setDisplayValue] = React.useState('');

  React.useEffect(() => {
    const outer = props.parser.parse(props.value);
    const inner = props.parser.parse(displayValue);

    // the value changed due to some outside factor. if the
    // prop change came from this component these values should
    // never differ.
    if (outer !== inner) {
      const formatted = props.parser.format(props.value);
      setDisplayValue(formatted);
    }

  }, [props.parser, props.value]);

  return (
    <input
      className="form-control"
      disabled={props.disabled}
      onChange={event => {
        const parsed = props.parser.parse(event.target.value);

        if (typeof parsed === 'undefined') {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        props.onChange(parsed);
        setDisplayValue(event.target.value);
      }}
      placeholder={props.placeholder}
      tabIndex={props.tabIndex}
      type="text"
      value={displayValue}
    />
  );
};

/**
 * Ensures that a value does not have more decimals than what
 * the currency specifies in its 'subunit' property. For example,
 * a USD amount is only allowed to have two decimals, eg: '4.20'.
 */
function hasTooManyDecimals(value: string, currency: Currency): boolean {
  const pattern = new RegExp(`[,.]\\d{${currency.subunit + 1}}`);
  return pattern.test(value);
}

type MoneyInputProps = Omit<NumberInputProps, 'parser'> & {
  currency: Currency
}

export const MoneyInput: React.FC<MoneyInputProps> = props => {
  const moneyParser: NumberParser = {
    format: (value) => formatIntegerAsMoneyDecimal(value, props.currency),
    parse: (value) => {
      if (typeof value === 'number') {
        if (Number.isNaN(value) || !Number.isFinite(value)) {
          return undefined;
        }
        return value;
      }
      if (hasTooManyDecimals(value, props.currency)) {
        return undefined;
      }
      return monetaryAmountToInteger(value, props.currency);
    },
  };

  return (
    <div className="input-group">
      <NumberInput
        {...props}
        parser={moneyParser}
      />
      <span className="input-group-text">
        {props.currency.symbol}
      </span>
    </div>
  );
};
