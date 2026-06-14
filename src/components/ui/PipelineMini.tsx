import { Fragment } from "react";
import { cn } from "@/lib/utils";

interface PipelineMiniProps {
  currentStage: number; // 1-4, 5=complete
  rejected?: boolean;
  rejectedAt?: number;
  infoAt?: number;
  hasMoi?: boolean;
  /** Show the current stage name (e.g. "FA Owner") next to the dots. */
  showLabel?: boolean;
  /** When showing the label, stack it below the dots instead of beside them. */
  labelBelow?: boolean;
}

// Stage number → human-readable name. Index 0 = stage 1.
const STAGE_NAMES = ["FA Owner", "Zone Owner", "Media Owner", "MOI"];

export function PipelineMini({ currentStage, rejected, rejectedAt, infoAt, hasMoi, showLabel, labelBelow }: PipelineMiniProps) {
  const stages = hasMoi ? 4 : 3;

  const stageLabel = (() => {
    if (rejected) return rejectedAt ? `Rejected · ${STAGE_NAMES[rejectedAt - 1]}` : "Rejected";
    if (currentStage > stages) return "Approved";
    return STAGE_NAMES[currentStage - 1] ?? "";
  })();

  const labelColor = rejected
    ? "#F87171"
    : currentStage > stages
    ? "#22C55E"
    : "var(--text-secondary)";

  return (
    <div style={{
      display: "inline-flex",
      flexDirection: labelBelow ? "column" : "row",
      alignItems: labelBelow ? "flex-start" : "center",
      gap: labelBelow ? 4 : 8,
    }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
        {Array.from({ length: stages }).map((_, i) => {
          const stageNum = i + 1;
          const isDone = currentStage > stageNum;
          const isActive = currentStage === stageNum && !rejected;
          const isRejected = rejected && rejectedAt === stageNum;
          const isMoi = i === 3;

          return (
            <Fragment key={stageNum}>
              {i > 0 && <span className={cn("pipeline-line", isDone && "is-done")} />}
              <span
                className={cn(
                  "pipeline-dot",
                  isMoi && "is-moi",
                  isDone && "is-done",
                  isActive && "is-active",
                  isRejected && "is-rejected"
                )}
                style={isRejected ? { background: "#F87171", borderColor: "rgba(248,113,113,0.5)" } : undefined}
              />
            </Fragment>
          );
        })}
      </div>

      {showLabel && stageLabel && (
        <span
          style={{
            fontSize: labelBelow ? 10 : 11,
            fontWeight: 600,
            whiteSpace: "nowrap",
            color: labelColor,
          }}
        >
          {stageLabel}
        </span>
      )}
    </div>
  );
}
