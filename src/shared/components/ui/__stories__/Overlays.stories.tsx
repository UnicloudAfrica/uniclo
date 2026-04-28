import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Globe, MoreVertical, Cloud } from "lucide-react";
import Tooltip from "../Tooltip";
import DropdownMenu from "../DropdownMenu";
import Tabs from "../Tabs";
import ModernButton from "../ModernButton";

const meta: Meta = { title: "Primitives/Overlays" };
export default meta;

export const TooltipBasic: StoryObj = {
  render: () => (
    <div className="flex items-center gap-3">
      <Tooltip content="Refresh the fleet snapshot" placement="top">
        <ModernButton variant="outline" size="sm" leftIcon={<Globe className="h-3.5 w-3.5" />}>
          Top
        </ModernButton>
      </Tooltip>
      <Tooltip content="Refresh" placement="bottom">
        <ModernButton variant="outline" size="sm">
          Bottom
        </ModernButton>
      </Tooltip>
      <Tooltip content="Press Enter" placement="left">
        <ModernButton variant="outline" size="sm">
          Left
        </ModernButton>
      </Tooltip>
      <Tooltip content="Press Esc to dismiss" placement="right">
        <ModernButton variant="outline" size="sm">
          Right
        </ModernButton>
      </Tooltip>
    </div>
  ),
};

export const DropdownMenuExample: StoryObj = {
  render: () => (
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
  ),
};

export const TabsAutomatic: StoryObj = {
  render: () => {
    const [active, setActive] = useState("a");
    return (
      <Tabs
        ariaLabel="Showcase tabs"
        value={active}
        onChange={setActive}
        items={[
          { value: "a", label: "Overview" },
          { value: "b", label: "Capacity", badge: "78%" },
          { value: "c", label: "Alarms", badge: 3 },
          { value: "d", label: "Disabled", disabled: true },
        ]}
        renderPanel={(v) => <p className="text-sm text-gray-600 font-outfit">Active: {v}</p>}
      />
    );
  },
};

export const TabsVertical: StoryObj = {
  render: () => {
    const [active, setActive] = useState("nodes");
    return (
      <Tabs
        ariaLabel="Vertical tabs"
        orientation="vertical"
        value={active}
        onChange={setActive}
        items={[
          { value: "nodes", label: "Nodes" },
          { value: "vms", label: "VMs" },
          { value: "vpcs", label: "VPCs" },
        ]}
        renderPanel={(v) => <p className="text-sm text-gray-600 font-outfit">{v}</p>}
      />
    );
  },
};
