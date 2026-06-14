"use client";
import PhoneInputLib from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface Props {
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
  placeholder?: string;
}

/** Phone field with a country-code dropdown, themed to match .form-control.
 *  Emits an E.164 string (e.g. "+97412345678"). */
export function PhoneInput({ value, onChange, error, placeholder = "Phone number" }: Props) {
  return (
    <div className={`qoc-phone${error ? " has-error" : ""}`}>
      <PhoneInputLib
        international
        defaultCountry="QA"
        value={value || undefined}
        onChange={(v) => onChange(v ?? "")}
        placeholder={placeholder}
      />
    </div>
  );
}
