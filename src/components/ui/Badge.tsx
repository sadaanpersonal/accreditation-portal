import { cn } from "@/lib/utils";

type Variant = "approved" | "pending" | "rejected" | "review" | "moi" | "completed" | "cancelled";

const LABELS: Record<Variant, string> = {
  approved: "Approved", pending: "Pending", rejected: "Rejected",
  review: "In Review", moi: "MOI Clearance", completed: "Completed",
  cancelled: "Cancelled",
};

interface Props {
  variant: Variant;
  solid?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function Badge({ variant, solid, children, className }: Props) {
  return (
    <span className={cn("badge", `badge-${variant}`, solid && "badge-solid", className)}>
      {children ?? LABELS[variant]}
    </span>
  );
}
