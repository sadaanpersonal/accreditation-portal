import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function GlassCard({ children, className, style }: Props) {
  return (
    <div className={cn("glass-card", className)} style={style}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("card-header", className)}>{children}</div>;
}

export function CardBody({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div className={cn("card-body", className)} style={style}>{children}</div>;
}
