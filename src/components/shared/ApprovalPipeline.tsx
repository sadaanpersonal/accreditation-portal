"use client";
import { ShieldCheck, MapPin, Newspaper, Building2, Check, X, HelpCircle } from "lucide-react";

export interface PipelineState {
  currentStage: number; // 1-4, 5=complete
  rejected: boolean;
  infoRequested: boolean;
  infoNote?: string;
}

const STAGES = [
  { name: "FA Owner",      sub: "Federation / Association approval",          icon: ShieldCheck },
  { name: "Zone Owner",    sub: "Assign zone access for this accreditation",   icon: MapPin },
  { name: "Media Owner",   sub: "Press & media credentials",                   icon: Newspaper },
  { name: "MOI Clearance", sub: "Ministry of Interior — external approval",    icon: Building2, isMoi: true },
];

interface Props {
  state: PipelineState;
  onApprove?: () => void;
  onReject?: () => void;
  onRequestInfo?: () => void;
  readOnly?: boolean;
  zoneContent?: React.ReactNode;
}

export function ApprovalPipeline({ state, onApprove, onReject, onRequestInfo, readOnly, zoneContent }: Props) {
  const { currentStage, rejected, infoRequested } = state;

  return (
    <div className="approval-pipeline">
      {STAGES.map((stage, i) => {
        const stageNum = i + 1;
        const isDone = (!rejected && !infoRequested && currentStage > stageNum) || currentStage > 4;
        const isActive = currentStage === stageNum && !rejected && !infoRequested;
        const isRej = rejected && currentStage === stageNum;
        const isInfo = infoRequested && currentStage === stageNum;
        const isPending = !isDone && !isActive && !isRej && !isInfo;

        const stageClass = [
          "approval-stage",
          stage.isMoi ? "is-moi" : "",
          isDone ? "is-done" : "",
          isActive ? "is-active" : "",
          isRej ? "is-rejected" : "",
          isInfo ? "is-info" : "",
          isPending ? "is-pending" : "",
        ].filter(Boolean).join(" ");

        const Icon = stage.icon;
        const showActions = isActive && !readOnly && (onApprove || onReject || onRequestInfo);

        return (
          <div key={stageNum}>
            {i > 0 && (
              <div className={`approval-connector${isDone ? " is-done" : ""}`} />
            )}
            <div className={stageClass}>
              <div className="approval-stage-icon">
                {isDone ? <Check size={18} /> : isRej ? <X size={18} /> : <Icon size={18} />}
              </div>
              <div className="approval-stage-body">
                <div className="approval-stage-title">{stage.name}</div>
                <div className="approval-stage-sub">{stage.sub}</div>

                {stageNum === 2 && isActive && zoneContent && (
                  <div style={{ marginTop: 12 }}>{zoneContent}</div>
                )}

                {showActions && (
                  <div className="approval-stage-actions">
                    {onApprove && (
                      <button className="btn btn-success btn-sm" onClick={onApprove}>
                        <Check size={14} /> Approve
                      </button>
                    )}
                    {onRequestInfo && !stage.isMoi && (
                      <button className="btn btn-warning btn-sm" onClick={onRequestInfo}>
                        <HelpCircle size={14} /> Request Info
                      </button>
                    )}
                    {onReject && (
                      <button className="btn btn-danger btn-sm" onClick={onReject}>
                        <X size={14} /> Reject
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isPending && (
                <span className="badge badge-pending" style={{ flexShrink: 0, fontSize: 10 }}>Pending</span>
              )}
              {isRej && (
                <span className="badge badge-rejected" style={{ flexShrink: 0, fontSize: 10 }}>Rejected</span>
              )}
              {isInfo && (
                <span className="badge badge-review" style={{ flexShrink: 0, fontSize: 10 }}>Info Req.</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
