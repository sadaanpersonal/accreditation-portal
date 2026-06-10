"use client";
import { Check } from "lucide-react";
import { Fragment } from "react";

interface Props {
  steps: string[];
  /** 0-based index of the active step. */
  current: number;
  /** Allow navigating back to an already-completed step. */
  onStepClick?: (index: number) => void;
}

export function Stepper({ steps, current, onStepClick }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", width: "100%", marginBottom: 24 }}>
      {steps.map((label, i) => {
        const done    = i < current;
        const active  = i === current;
        const clickable = done && !!onStepClick;

        const circleColor = active || done ? "var(--gold)" : "var(--surface-4)";
        const circleText  = active ? "#1A0810" : done ? "#1A0810" : "var(--text-muted)";

        return (
          <Fragment key={label}>
            <div
              onClick={clickable ? () => onStepClick!(i) : undefined}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                cursor: clickable ? "pointer" : "default", flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 34, height: 34, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: circleColor, color: circleText,
                  fontWeight: 700, fontSize: 14,
                  border: active ? "2px solid var(--gold-light)" : "2px solid transparent",
                  boxShadow: active ? "0 0 0 4px rgba(201,168,76,0.15)" : "none",
                  transition: "all 0.2s",
                }}
              >
                {done ? <Check size={17} /> : i + 1}
              </div>
              <span
                style={{
                  fontSize: 11, fontWeight: active ? 700 : 500,
                  color: active ? "var(--gold)" : done ? "var(--text-primary)" : "var(--text-muted)",
                  whiteSpace: "nowrap", textAlign: "center",
                }}
              >
                {label}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1, height: 2, margin: "0 8px",
                  marginBottom: 18, // align with the circles, above the labels
                  background: i < current ? "var(--gold)" : "var(--border)",
                  transition: "background 0.2s",
                }}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
