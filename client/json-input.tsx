import * as React from 'react';

type JsonInputProps<T> = {
  onChange: (next: T) => unknown
  rows?: number
  value: T
}

function toJsonStringWithUnescapedNewlines(value: unknown): string {
  const str = JSON.stringify(value, undefined, 2);

  return str
    .replace(/:\s*"([^"]+)"/g, (match, g: string) => {
      const inner = g.replace(/\\n/g, '\n');
      return `: "${inner}"`;
    });
}

function withEscapedNewlines(value: string): string {
  // this is so fucking stupid but whatever, we need
  // to be able to write newlines into our json values.
  // will break immediately when operating on arrays.
  const json = value
    .replace(/:\s*"([^"]+)"/g, (match, g: string) => {
      const inner = g.replace(/\r?\n/g, '\\n');
      return `: "${inner}"`;
    });

  return json;
}

export function JsonInput<T>(props: JsonInputProps<T>) {
  const [json, setJson] = React.useState<string>(
    toJsonStringWithUnescapedNewlines(props.value)
  );

  return (
    <textarea
      className="form-control font-monospace"
      onChange={event => {
        setJson(event.target.value);

        try {
          const esc = withEscapedNewlines(event.target.value);
          const parsed = JSON.parse(esc);
          props.onChange(parsed);
        } catch (e) {
          console.error(e);
          // do nothing.
        }
      }}
      rows={props.rows}
      value={json}
    />
  );
}
