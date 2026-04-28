import type { Meta, StoryObj } from "@storybook/react-vite";
import { Cpu, MemoryStick, HardDrive } from "lucide-react";
import Gauge from "../Gauge";
import ProgressBar from "../ProgressBar";

const gaugeMeta: Meta<typeof Gauge> = {
  title: "Primitives/Progress/Gauge",
  component: Gauge,
  args: { value: 42, label: "CPU", icon: <Cpu className="h-3.5 w-3.5" /> },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
    tone: { control: "select", options: ["auto", "primary", "secondary", "success", "warning", "danger"] },
    size: { control: "radio", options: ["sm", "md", "lg"] },
  },
};
export default gaugeMeta;
type GaugeStory = StoryObj<typeof Gauge>;

export const Healthy: GaugeStory = { args: { value: 32 } };
export const Warning: GaugeStory = { args: { value: 78, label: "Memory", icon: <MemoryStick className="h-3.5 w-3.5" /> } };
export const Critical: GaugeStory = { args: { value: 94, label: "Storage", icon: <HardDrive className="h-3.5 w-3.5" /> } };
export const AllSizes: GaugeStory = {
  render: (args) => (
    <div className="flex items-end gap-6">
      <Gauge {...args} size="sm" />
      <Gauge {...args} size="md" />
      <Gauge {...args} size="lg" />
    </div>
  ),
};
export const CustomDisplay: GaugeStory = {
  args: { value: 75, displayValue: "3 / 4", label: "Nodes" },
};

export const ProgressBarHealthy: StoryObj<typeof ProgressBar> = {
  render: (args) => (
    <div className="w-72 space-y-3">
      <ProgressBar {...args} value={32} label="CPU" />
      <ProgressBar {...args} value={78} label="Memory" />
      <ProgressBar {...args} value={94} label="Storage" />
    </div>
  ),
};
