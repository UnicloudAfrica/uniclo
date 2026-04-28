import type { Meta, StoryObj } from "@storybook/react-vite";
import { Server, AlertTriangle, Globe, Users, CheckCircle2, AlertCircle } from "lucide-react";
import StatTile from "../StatTile";
import KpiTile from "../KpiTile";
import IconTile from "../IconTile";
import SurfaceCard from "../SurfaceCard";

const meta: Meta = { title: "Primitives/Tiles" };
export default meta;

export const StatTileGrid: StoryObj = {
  render: () => (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-3xl">
      <StatTile label="VMs" value={342} icon={<Server className="h-3 w-3" />} />
      <StatTile label="Alarms" value={3} icon={<AlertTriangle className="h-3 w-3" />} tone="danger" />
      <StatTile label="Tenants" value={28} icon={<Users className="h-3 w-3" />} tone="primary" />
      <StatTile label="Loading" value="" loading />
    </div>
  ),
};

export const KpiTileGrid: StoryObj = {
  render: () => (
    <SurfaceCard variant="signal-panel" padding="lg" radius="xl">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiTile icon={<Globe className="h-3.5 w-3.5" />} label="Regions" value={7} tone="primary" />
        <KpiTile icon={<Server className="h-3.5 w-3.5" />} label="VMs" value="1,247" tone="primary" />
        <KpiTile icon={<Users className="h-3.5 w-3.5" />} label="Tenants" value={28} tone="secondary" />
        <KpiTile icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Healthy" value={5} tone="success" />
        <KpiTile icon={<AlertCircle className="h-3.5 w-3.5" />} label="Degraded" value={1} tone="warning" />
        <KpiTile icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Critical" value={1} tone="danger" />
      </div>
    </SurfaceCard>
  ),
};

export const IconTileTones: StoryObj = {
  render: () => (
    <div className="flex items-center gap-3">
      {(["primary", "secondary", "success", "warning", "danger", "neutral"] as const).map((tone) => (
        <IconTile key={tone} icon={<Server className="h-4 w-4" />} tone={tone} />
      ))}
    </div>
  ),
};

export const IconTileSizes: StoryObj = {
  render: () => (
    <div className="flex items-end gap-3">
      <IconTile icon={<Server className="h-3.5 w-3.5" />} size="sm" />
      <IconTile icon={<Server className="h-4 w-4" />} size="md" />
      <IconTile icon={<Server className="h-5 w-5" />} size="lg" />
    </div>
  ),
};
