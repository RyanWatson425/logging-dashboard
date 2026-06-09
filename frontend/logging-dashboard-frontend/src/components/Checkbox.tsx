import type { ChangeEvent } from "react";

interface CheckboxParams {
  id: string;
  label: string;
  isChecked: boolean;
  onChange: (e: ChangeEvent) => void;
}

const Checkbox = ({ id, label, isChecked, onChange }: CheckboxParams) => {
  return (
    <div style={{ display: "inline-flex" }}>
      <input
        id={id}
        type="checkbox"
        checked={isChecked}
        value={String(isChecked)}
        aria-labelledby={id}
        onChange={onChange}
      />
      <label htmlFor={id}>{label}</label>
    </div>
  );
};

export default Checkbox;
