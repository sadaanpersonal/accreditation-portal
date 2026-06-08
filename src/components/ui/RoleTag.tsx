import { getRoleClass } from "@/lib/utils";

export function RoleTag({ role }: { role: string }) {
  return <span className={`role-tag ${getRoleClass(role)}`}>{role}</span>;
}
