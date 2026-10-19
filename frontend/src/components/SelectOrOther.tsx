"use client";

import { useMemo, useState } from "react";

const OTHER = "__other__";

type Props = {
  id?: string;
  label: string;
  value: string | null | undefined;
  options: readonly string[];
  onChange: (value: string | null) => void;
  allowEmpty?: boolean;
  emptyLabel?: string;
};

export default function SelectOrOther({
  id,
  label,
  value,
  options,
  onChange,
  allowEmpty = true,
  emptyLabel = "—",
}: Props) {
  const current = value ?? "";
  const inList = current !== "" && options.includes(current);
  const [otherMode, setOtherMode] = useState(!inList && current !== "");

  const selectValue = useMemo(() => {
    if (!current) return "";
    if (inList) return current;
    return OTHER;
  }, [current, inList]);

  function handleSelect(next: string) {
    if (next === "") {
      setOtherMode(false);
      onChange(null);
      return;
    }
    if (next === OTHER) {
      setOtherMode(true);
      if (inList || !current) onChange("");
      return;
    }
    setOtherMode(false);
    onChange(next);
  }

  return (
    <label>
      {label}
      <select id={id} value={otherMode ? OTHER : selectValue} onChange={(e) => handleSelect(e.target.value)}>
        {allowEmpty && <option value="">{emptyLabel}</option>}
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
        <option value={OTHER}>Other…</option>
      </select>
      {otherMode && (
        <input
          className="other-input"
          value={current}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="Enter custom value"
        />
      )}
    </label>
  );
}
