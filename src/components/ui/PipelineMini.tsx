import { cn } from "@/lib/utils";

interface PipelineMiniProps {
  currentStage: number; // 1-4, 5=complete
  rejected?: boolean;
  rejectedAt?: number;
  infoAt?: number;
  hasMoi?: boolean;
}

export function PipelineMini({ currentStage, rejected, rejectedAt, infoAt, hasMoi }: PipelineMiniProps) {
  const stages = hasMoi ? 4 : 3;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
      {Array.from({ length: stages }).map((_, i) => {
        const stageNum = i + 1;
        const isDone = currentStage > stageNum;
        const isActive = currentStage === stageNum && !rejected;
        const isRejected = rejected && rejectedAt === stageNum;
        const isMoi = i === 3;

        return (
          <>
            {i > 0 && <span className={cn("pipeline-line", isDone && "is-done")} key={`line-${i}`} />}
            <span
              key={stageNum}
              className={cn(
                "pipeline-dot",
                isMoi && "is-moi",
                isDone && "is-done",
                isActive && "is-active",
                isRejected && "is-rejected"
              )}
              style={isRejected ? { background: "#F87171", borderColor: "rgba(248,113,113,0.5)" } : undefined}
            />
          </>
        );
      })}
    </div>
  );
}
