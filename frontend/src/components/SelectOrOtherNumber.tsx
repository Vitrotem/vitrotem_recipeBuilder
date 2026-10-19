"use client";

import SelectOrOther from "./SelectOrOther";

type Props = {
  label: string;
  value: number | null | undefined;
  options: readonly string[];
  onChange: (value: number | null) => void;
  allowEmpty?: boolean;
};

export default function SelectOrOtherNumber({
  label,
  value,
  options,
  onChange,
  allowEmpty = true,
}: Props) {
  const str = value == null || Number.isNaN(value) ? "" : String(value);

  return (
    <SelectOrOther
      label={label}
      value={str}
      options={options}
      allowEmpty={allowEmpty}
      onChange={(v) => {
        if (v == null || v === "") {
          onChange(null);
          return;
        }
        const n = Number(v);
        onChange(Number.isFinite(n) ? n : null);
      }}
    />
  );
}
