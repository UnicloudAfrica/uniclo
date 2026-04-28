import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Filter } from "lucide-react";
import Avatar from "../Avatar";
import Breadcrumbs from "../Breadcrumbs";
import Chip from "../Chip";
import DescriptionList from "../DescriptionList";
import SurfaceCard from "../SurfaceCard";

const meta: Meta = { title: "Primitives/Identity & Navigation" };
export default meta;

export const AvatarSizes: StoryObj = {
  render: () => (
    <div className="flex items-end gap-3">
      <Avatar name="Schneider Komolafe" size="xs" />
      <Avatar name="Schneider Komolafe" size="sm" />
      <Avatar name="Schneider Komolafe" size="md" status="online" />
      <Avatar name="Charles Krish" size="lg" status="busy" />
      <Avatar name="UC" size="xl" shape="square" />
    </div>
  ),
};

export const AvatarFallback: StoryObj = {
  render: () => (
    <div className="flex items-end gap-3">
      <Avatar name="With image" src="https://images.unsplash.com/photo-1633332755192-727a05c4013d" size="lg" />
      <Avatar name="Broken Image" src="/does-not-exist.png" size="lg" />
      <Avatar name="Single Word" size="lg" />
    </div>
  ),
};

export const BreadcrumbsExample: StoryObj = {
  render: () => (
    <Breadcrumbs
      items={[
        { label: "NOC", to: "/admin-dashboard/noc" },
        { label: "Lagos", to: "/admin-dashboard/noc/regions/ng-lagos-1" },
        { label: "VPC topology" },
      ]}
    />
  ),
};

export const ChipFilters: StoryObj = {
  render: () => {
    const [chips, setChips] = useState(["nigeria", "south-africa", "ghana"]);
    const [selected, setSelected] = useState<string[]>(["nigeria"]);
    return (
      <div className="flex flex-wrap gap-2">
        {chips.map((id) => (
          <Chip
            key={id}
            selected={selected.includes(id)}
            onClick={() =>
              setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
            }
            onDismiss={() => setChips((c) => c.filter((x) => x !== id))}
            icon={<Filter className="h-3 w-3" />}
            tone="primary"
          >
            {id}
          </Chip>
        ))}
      </div>
    );
  },
};

export const ChipTones: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Chip tone="neutral">neutral</Chip>
      <Chip tone="primary" selected>primary</Chip>
      <Chip tone="secondary" selected>secondary</Chip>
      <Chip tone="success" selected>success</Chip>
      <Chip tone="warning" selected>warning</Chip>
      <Chip tone="danger" selected>danger</Chip>
    </div>
  ),
};

export const DescriptionListLayouts: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-4">
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
      <SurfaceCard variant="card" padding="md" className="w-72">
        <DescriptionList
          layout="stacked"
          items={[
            { term: "Status", description: "Active" },
            { term: "Region", description: "Lagos" },
          ]}
        />
      </SurfaceCard>
    </div>
  ),
};
