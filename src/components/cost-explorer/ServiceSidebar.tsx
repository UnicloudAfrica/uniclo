import { Server, HardDrive, Database, Cloud, ArrowLeftRight, Shield, ShieldCheck, Activity, Archive } from "lucide-react";

const SERVICES = [
  { id: "compute", label: "Compute", icon: Server, description: "Virtual machines" },
  { id: "storage", label: "Block Storage", icon: HardDrive, description: "Persistent volumes" },
  { id: "object-storage", label: "Object Storage", icon: Cloud, description: "S3-compatible" },
  { id: "databases", label: "Managed Databases", icon: Database, description: "PostgreSQL, MySQL, MongoDB" },
  { id: "migration", label: "Migration & DR", icon: ArrowLeftRight, description: "Replication, failover" },
  { id: "backup", label: "Backup", icon: Archive, description: "Orchestration, per-VM" },
  { id: "protection", label: "Protection Plans", icon: ShieldCheck, description: "Backup, DR, replication" },
  { id: "shield", label: "Shield", icon: Shield, description: "WAF, DDoS protection" },
  { id: "monitoring", label: "Monitoring", icon: Activity, description: "Metrics, alerts, logs" },
];

interface ServiceSidebarProps {
  activeService: string;
  onSelect: (id: string) => void;
}

export default function ServiceSidebar({ activeService, onSelect }: ServiceSidebarProps) {
  return (
    <div className="space-y-1">
      <h3 className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-gray-400">Services</h3>
      {SERVICES.map((svc) => {
        const isActive = activeService === svc.id;
        return (
          <button
            key={svc.id}
            onClick={() => onSelect(svc.id)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
              isActive ? "bg-primary-50 text-primary-700 font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <svc.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary-600" : "text-gray-400"}`} />
            <div>
              <div>{svc.label}</div>
              <div className="text-[10px] text-gray-400">{svc.description}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
