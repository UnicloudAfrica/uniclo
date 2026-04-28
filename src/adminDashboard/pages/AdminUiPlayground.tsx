/**
 * UI Primitives Playground — admin-gated visual catalog of every primitive.
 *
 * Replaces Storybook for the immediate need (no new dependencies). Every
 * primitive is rendered in light + dark + RTL variants on a single page so
 * designers and devs can verify the design system in one click.
 *
 * Toggle theme + direction via the controls at the top.
 *
 * Add a new primitive: import it, drop a <Section> with examples below.
 */

import React, { useState } from "react";
import { Cpu, MemoryStick, Server, AlertTriangle, Globe, Filter, MoreVertical, Cloud } from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import {
  SurfaceCard,
  Eyebrow,
  SectionHeader,
  Gauge,
  ProgressBar,
  StatTile,
  KpiTile,
  IconTile,
  StatusPill,
  InfoCallout,
  LoadingState,
  ErrorState,
  ResourceEmptyState,
  Tooltip,
  DropdownMenu,
  Tabs,
  Avatar,
  Breadcrumbs,
  Chip,
  DescriptionList,
  ModernButton,
} from "@/shared/components/ui";

const Section: React.FC<{ title: string; children: React.ReactNode; description?: string }> = ({
  title,
  description,
  children,
}) => (
  <section className="space-y-3">
    <SectionHeader title={title} description={description} />
    <SurfaceCard variant="card" padding="lg" radius="xl">
      <div className="space-y-6">{children}</div>
    </SurfaceCard>
  </section>
);

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <Eyebrow size="xs" className="mb-2">
      {label}
    </Eyebrow>
    <div className="flex flex-wrap items-start gap-3">{children}</div>
  </div>
);

const AdminUiPlayground: React.FC = () => {
  const [dark, setDark] = useState(false);
  const [rtl, setRtl] = useState(false);
  const [activeTab, setActiveTab] = useState("a");
  const [selectedChips, setSelectedChips] = useState<string[]>(["nigeria"]);
  const [chips, setChips] = useState<string[]>(["nigeria", "south-africa", "ghana"]);

  const toggleChip = (id: string) => {
    setSelectedChips((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div data-theme={dark ? "dark" : undefined} dir={rtl ? "rtl" : "ltr"}>
      <AdminPageShell
        title="UI Primitives Playground"
        description="Visual catalog for every shared primitive. Toggle theme + direction to verify dark mode, RTL, and tenant whitelabels."
        actions={
          <div className="flex items-center gap-2">
            <ModernButton
              variant={dark ? "primary" : "outline"}
              size="sm"
              onClick={() => setDark((v) => !v)}
            >
              Dark: {dark ? "on" : "off"}
            </ModernButton>
            <ModernButton
              variant={rtl ? "primary" : "outline"}
              size="sm"
              onClick={() => setRtl((v) => !v)}
            >
              RTL: {rtl ? "on" : "off"}
            </ModernButton>
          </div>
        }
      >
        <div className="space-y-8">
          <Section title="Surfaces" description="Six SurfaceCard variants on tokens.">
            <div className="grid gap-3 md:grid-cols-2">
              <SurfaceCard variant="card" padding="lg">card</SurfaceCard>
              <SurfaceCard variant="soft" padding="lg">soft</SurfaceCard>
              <SurfaceCard variant="inset" padding="lg">inset</SurfaceCard>
              <SurfaceCard variant="hero" padding="lg">hero</SurfaceCard>
              <SurfaceCard variant="signal-panel" padding="lg">signal-panel</SurfaceCard>
              <SurfaceCard variant="brand-hero" padding="lg">brand-hero</SurfaceCard>
            </div>
          </Section>

          <Section title="Typography">
            <Row label="Eyebrow tones">
              <Eyebrow tone="muted">muted eyebrow</Eyebrow>
              <Eyebrow tone="strong">strong eyebrow</Eyebrow>
              <SurfaceCard variant="signal-panel" padding="sm" radius="md">
                <Eyebrow tone="onDark">on-dark eyebrow</Eyebrow>
              </SurfaceCard>
            </Row>
            <Row label="SectionHeader">
              <div className="w-full">
                <SectionHeader
                  title="Hypervisor nodes"
                  count={4}
                  description="All nodes active"
                  icon={<Server className="h-4 w-4" />}
                  actions={<ModernButton size="sm" variant="ghost">Configure</ModernButton>}
                />
              </div>
            </Row>
          </Section>

          <Section title="Progress">
            <Row label="Gauge — auto tone">
              <Gauge label="CPU" value={32} icon={<Cpu className="h-3.5 w-3.5" />} />
              <Gauge label="Memory" value={78} icon={<MemoryStick className="h-3.5 w-3.5" />} />
              <Gauge label="Storage" value={94} />
            </Row>
            <Row label="ProgressBar">
              <div className="w-64 space-y-3">
                <ProgressBar value={32} label="CPU" />
                <ProgressBar value={78} label="Memory" />
                <ProgressBar value={94} label="Storage" />
              </div>
            </Row>
          </Section>

          <Section title="Tiles">
            <Row label="StatTile (light)">
              <StatTile label="VMs" value={342} icon={<Server className="h-3 w-3" />} />
              <StatTile label="Alarms" value={3} icon={<AlertTriangle className="h-3 w-3" />} tone="danger" />
              <StatTile label="Loading" value="" loading />
            </Row>
            <Row label="KpiTile (dark)">
              <SurfaceCard variant="signal-panel" padding="md" className="grid grid-cols-3 gap-3 w-full">
                <KpiTile icon={<Globe className="h-3.5 w-3.5" />} label="Regions" value={7} tone="primary" />
                <KpiTile icon={<Server className="h-3.5 w-3.5" />} label="VMs" value="1,247" tone="primary" />
                <KpiTile icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Critical" value={2} tone="danger" />
              </SurfaceCard>
            </Row>
            <Row label="IconTile tones">
              <IconTile icon={<Server className="h-4 w-4" />} tone="primary" />
              <IconTile icon={<Server className="h-4 w-4" />} tone="secondary" />
              <IconTile icon={<Server className="h-4 w-4" />} tone="success" />
              <IconTile icon={<Server className="h-4 w-4" />} tone="warning" />
              <IconTile icon={<Server className="h-4 w-4" />} tone="danger" />
              <IconTile icon={<Server className="h-4 w-4" />} tone="neutral" />
            </Row>
          </Section>

          <Section title="Status & feedback">
            <Row label="StatusPill">
              <StatusPill tone="success" label="active" />
              <StatusPill tone="warning" label="pending" />
              <StatusPill tone="danger" label="failed" />
              <StatusPill tone="info" label="info" />
              <StatusPill tone="neutral" label="unknown" />
            </Row>
            <Row label="InfoCallout">
              <div className="w-full space-y-3">
                <InfoCallout tone="info" title="Heads up">Trial expires in 3 days.</InfoCallout>
                <InfoCallout tone="success" title="Saved" onDismiss={() => {}}>Dismissable success banner.</InfoCallout>
                <InfoCallout tone="warning" title="Region offline">Awaiting credentials.</InfoCallout>
                <InfoCallout tone="danger" title="Provisioning failed">Provider rejected the request.</InfoCallout>
              </div>
            </Row>
            <Row label="LoadingState + ErrorState + Empty">
              <div className="grid w-full gap-3 md:grid-cols-3">
                <LoadingState message="Refreshing snapshots…" />
                <ErrorState onRetry={() => {}} autoFocusRetry={false} />
                <ResourceEmptyState title="No items yet" message="Provisioned items will appear here." />
              </div>
            </Row>
          </Section>

          <Section title="Overlays">
            <Row label="Tooltip">
              <Tooltip content="Refresh the fleet snapshot">
                <ModernButton variant="outline" size="sm" leftIcon={<Globe className="h-3.5 w-3.5" />}>
                  Hover or focus me
                </ModernButton>
              </Tooltip>
            </Row>
            <Row label="DropdownMenu">
              <DropdownMenu
                trigger={
                  <ModernButton variant="outline" size="sm" leftIcon={<MoreVertical className="h-3.5 w-3.5" />}>
                    Actions
                  </ModernButton>
                }
                items={[
                  { label: "Edit", icon: <Cloud className="h-3.5 w-3.5" /> },
                  { label: "Duplicate" },
                  { label: "Archive", separatorBefore: true },
                  { label: "Delete", destructive: true },
                ]}
              />
            </Row>
            <Row label="Tabs (automatic)">
              <div className="w-full">
                <Tabs
                  ariaLabel="Showcase tabs"
                  value={activeTab}
                  onChange={setActiveTab}
                  items={[
                    { value: "a", label: "Overview" },
                    { value: "b", label: "Capacity", badge: "78%" },
                    { value: "c", label: "Alarms", badge: 3 },
                    { value: "d", label: "Disabled", disabled: true },
                  ]}
                  renderPanel={(v) => <p className="text-sm text-gray-600">Active: {v}</p>}
                />
              </div>
            </Row>
          </Section>

          <Section title="Identity & navigation">
            <Row label="Avatar">
              <Avatar name="Schneider Komolafe" size="xs" />
              <Avatar name="Schneider Komolafe" size="sm" />
              <Avatar name="Schneider Komolafe" size="md" status="online" />
              <Avatar name="Charles Krish" size="lg" status="busy" />
              <Avatar name="UC" size="xl" shape="square" />
            </Row>
            <Row label="Breadcrumbs">
              <Breadcrumbs
                items={[
                  { label: "NOC", to: "/admin-dashboard/noc" },
                  { label: "Lagos", to: "/admin-dashboard/noc/regions/ng-lagos-1" },
                  { label: "VPC topology" },
                ]}
              />
            </Row>
            <Row label="Chip">
              {chips.map((id) => (
                <Chip
                  key={id}
                  selected={selectedChips.includes(id)}
                  onClick={() => toggleChip(id)}
                  onDismiss={() => setChips((c) => c.filter((x) => x !== id))}
                  icon={<Filter className="h-3 w-3" />}
                  tone="primary"
                >
                  {id}
                </Chip>
              ))}
            </Row>
            <Row label="DescriptionList layouts">
              <SurfaceCard variant="card" padding="md" className="w-72">
                <DescriptionList
                  items={[
                    { term: "Uptime", description: "7d 3h" },
                    { term: "Access", description: "10.0.0.5" },
                    { term: "Cores", description: 32 },
                  ]}
                />
              </SurfaceCard>
              <SurfaceCard variant="card" padding="md" className="w-72">
                <DescriptionList
                  layout="grid"
                  items={[
                    { term: "Uptime", description: "7d 3h" },
                    { term: "Access", description: "10.0.0.5" },
                    { term: "Cores", description: 32 },
                  ]}
                />
              </SurfaceCard>
            </Row>
          </Section>
        </div>
      </AdminPageShell>
    </div>
  );
};

export default AdminUiPlayground;
