"use client";

import ReactDatePicker from "react-datepicker";
import { Calendar } from "lucide-react";

interface Props {
  /** ISO date string (yyyy-MM-dd) or "" when empty. */
  value: string;
  /** Receives an ISO date string (yyyy-MM-dd) or "" when cleared. */
  onChange: (iso: string) => void;
  placeholder?: string;
  /** Earliest selectable date (Date). */
  minDate?: Date;
  /** Latest selectable date (Date). */
  maxDate?: Date;
  /** Show month/year dropdowns for fast navigation (good for birth dates). */
  showDropdowns?: boolean;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  error?: boolean;
  /** Render the calendar in a centered portal — use inside scrollable/overflow containers (e.g. modals) so it isn't clipped. */
  portal?: boolean;
}

/** Parse a yyyy-MM-dd string into a local Date without timezone drift. */
function parseISO(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** Format a Date as yyyy-MM-dd in local time (no UTC shift). */
function toISO(date: Date | null): string {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function DatePicker({
  value, onChange, placeholder = "Select a date",
  minDate, maxDate, showDropdowns, required, disabled, id, error, portal,
}: Props) {
  return (
    <div className={`qoc-datepicker${error ? " has-error" : ""}`} style={{ position: "relative" }}>
      <ReactDatePicker
        id={id}
        selected={parseISO(value)}
        onChange={(date: Date | null) => onChange(toISO(date))}
        dateFormat="dd MMM yyyy"
        placeholderText={placeholder}
        minDate={minDate}
        maxDate={maxDate}
        required={required}
        disabled={disabled}
        showMonthDropdown={showDropdowns}
        showYearDropdown={showDropdowns}
        dropdownMode="select"
        isClearable={!disabled}
        showPopperArrow={false}
        withPortal={portal}
        className="form-control"
        wrapperClassName="qoc-datepicker-wrapper"
        popperClassName="qoc-datepicker-popper"
        calendarClassName="qoc-datepicker-calendar"
      />
      <Calendar
        size={15}
        style={{
          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
          color: "var(--text-muted)", pointerEvents: "none",
        }}
      />
    </div>
  );
}
