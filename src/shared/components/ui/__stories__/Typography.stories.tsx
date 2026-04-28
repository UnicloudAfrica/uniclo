import type { Meta, StoryObj } from "@storybook/react-vite";
import { Server } from "lucide-react";
import Eyebrow from "../Eyebrow";
import SectionHeader from "../SectionHeader";
import ModernButton from "../ModernButton";

const eyebrowMeta: Meta<typeof Eyebrow> = {
  title: "Primitives/Typography/Eyebrow",
  component: Eyebrow,
  args: { children: "Section label" },
  argTypes: {
    size: { control: "radio", options: ["xs", "sm", "md"] },
    tone: { control: "radio", options: ["muted", "strong", "onDark"] },
    as: { control: "select", options: ["span", "div", "label", "dt", "legend", "p"] },
  },
};
export default eyebrowMeta;
type EyebrowStory = StoryObj<typeof Eyebrow>;

export const Default: EyebrowStory = {};
export const WithIcon: EyebrowStory = {
  args: { icon: <Server className="h-3 w-3" />, children: "With icon" },
};
export const Strong: EyebrowStory = { args: { tone: "strong" } };
export const Sizes: EyebrowStory = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Eyebrow {...args} size="xs">xs eyebrow</Eyebrow>
      <Eyebrow {...args} size="sm">sm eyebrow</Eyebrow>
      <Eyebrow {...args} size="md">md eyebrow</Eyebrow>
    </div>
  ),
};

export const SectionHeaderBasic: StoryObj<typeof SectionHeader> = {
  render: (args) => <SectionHeader {...args} />,
  args: {
    title: "Hypervisor nodes",
    count: 4,
    description: "All nodes active",
    icon: <Server className="h-4 w-4" />,
    actions: (
      <ModernButton size="sm" variant="ghost">
        Configure
      </ModernButton>
    ),
  },
};
