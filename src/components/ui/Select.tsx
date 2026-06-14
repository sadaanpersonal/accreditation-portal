"use client";
import ReactSelect, {
  type StylesConfig,
  type GroupBase,
} from "react-select";

export interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  options: SelectOption[];
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  isSearchable?: boolean;
  isClearable?: boolean;
  isDisabled?: boolean;
  id?: string;
  /** Accessible label when there is no visible <label> bound to this field. */
  ariaLabel?: string;
  /** Fixed width — used for compact inline filter dropdowns. */
  width?: number | string;
  /** Extra inline styles applied to the outer container. */
  style?: React.CSSProperties;
}

/**
 * App-wide styled select, built on react-select and themed to match the
 * portal's glass / maroon-gold design via CSS variables (so it tracks the
 * light/dark theme automatically). Drop-in API: pass a plain string `value`
 * and receive a plain string back from `onChange`.
 *
 * The menu is portalled to <body> so it never gets clipped inside modals
 * or cards that use `overflow: hidden`.
 */
export function Select({
  options,
  value,
  onChange,
  placeholder = "Select…",
  isSearchable = false,
  isClearable = false,
  isDisabled = false,
  id,
  ariaLabel,
  width,
  style,
}: Props) {
  const selected = options.find(o => o.value === value) ?? null;

  return (
    <ReactSelect<SelectOption, false, GroupBase<SelectOption>>
      inputId={id}
      aria-label={ariaLabel}
      classNamePrefix="qoc-select"
      options={options}
      value={selected}
      onChange={opt => onChange(opt?.value ?? "")}
      placeholder={placeholder}
      isSearchable={isSearchable}
      isClearable={isClearable}
      isDisabled={isDisabled}
      menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
      menuPlacement="auto"
      styles={buildStyles(width, style)}
    />
  );
}

// ── Theme ────────────────────────────────────────────────────────────────────
function buildStyles(
  width?: number | string,
  containerStyle?: React.CSSProperties,
): StylesConfig<SelectOption, false> {
  return {
    container: base => ({ ...base, width: width ?? "100%", ...containerStyle }),
    control: (base, state) => ({
      ...base,
      minHeight: 40,
      width: width ?? "100%",
      background: "var(--surface-3)",
      borderRadius: "var(--radius-sm)",
      borderColor: state.isFocused ? "var(--border-strong)" : "var(--border)",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(201,168,76,0.08)" : "none",
      fontSize: 13.5,
      cursor: "pointer",
      transition: "var(--transition)",
      "&:hover": { borderColor: "var(--border-strong)" },
    }),
    valueContainer: base => ({ ...base, padding: "2px 12px" }),
    singleValue: base => ({ ...base, color: "var(--text-primary)" }),
    input: base => ({ ...base, color: "var(--text-primary)" }),
    placeholder: base => ({ ...base, color: "var(--text-muted)" }),
    indicatorSeparator: () => ({ display: "none" }),
    dropdownIndicator: (base, state) => ({
      ...base,
      color: "var(--text-muted)",
      padding: "0 8px",
      transition: "transform 0.15s",
      transform: state.selectProps.menuIsOpen ? "rotate(180deg)" : "none",
      "&:hover": { color: "var(--text-primary)" },
    }),
    clearIndicator: base => ({ ...base, color: "var(--text-muted)", padding: "0 4px" }),
    menuPortal: base => ({ ...base, zIndex: 9999 }),
    menu: base => ({
      ...base,
      background: "var(--surface-2)",
      border: "1px solid var(--border-strong)",
      borderRadius: 10,
      boxShadow: "0 16px 48px rgba(0,0,0,0.45)",
      overflow: "hidden",
    }),
    menuList: base => ({ ...base, padding: 4 }),
    option: (base, state) => ({
      ...base,
      fontSize: 13.5,
      borderRadius: 8,
      cursor: "pointer",
      color: state.isSelected ? "var(--gold)" : "var(--text-primary)",
      background: state.isSelected
        ? "rgba(107,15,43,0.35)"
        : state.isFocused
        ? "rgba(201,168,76,0.08)"
        : "transparent",
      "&:active": { background: "rgba(107,15,43,0.5)" },
    }),
    noOptionsMessage: base => ({ ...base, color: "var(--text-muted)", fontSize: 13 }),
  };
}
