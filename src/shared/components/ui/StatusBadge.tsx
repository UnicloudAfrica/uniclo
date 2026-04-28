import { friendlyStatus, statusColor } from "@/shared/labels/cloudTerms";

interface Props {
  status: string | null | undefined;
  className?: string;
}

export default function StatusBadge({ status, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(
        status,
      )} ${className}`}
    >
      {friendlyStatus(status)}
    </span>
  );
}
