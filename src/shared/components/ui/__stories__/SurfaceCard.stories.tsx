import type { Meta, StoryObj } from "@storybook/react-vite";
import SurfaceCard from "../SurfaceCard";

const meta: Meta<typeof SurfaceCard> = {
  title: "Primitives/SurfaceCard",
  component: SurfaceCard,
  args: {
    children: "Surface body content",
    padding: "md",
    radius: "lg",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["card", "soft", "inset", "hero", "signal-panel", "brand-hero"],
    },
    padding: { control: "select", options: ["none", "sm", "md", "lg", "xl"] },
    radius: { control: "select", options: ["md", "lg", "xl", "2xl"] },
    interactive: { control: "boolean" },
  },
};
export default meta;

type Story = StoryObj<typeof SurfaceCard>;

export const Card: Story = { args: { variant: "card" } };
export const Soft: Story = { args: { variant: "soft" } };
export const Inset: Story = { args: { variant: "inset" } };
export const Hero: Story = { args: { variant: "hero" } };
export const SignalPanel: Story = {
  args: { variant: "signal-panel", children: <span style={{ color: "white" }}>Brand signal panel hero</span> },
};
export const BrandHero: Story = {
  args: { variant: "brand-hero", children: <span style={{ color: "white" }}>Full brand hero</span> },
};

export const InteractiveButton: Story = {
  args: {
    as: "button",
    onClick: () => {
      // eslint-disable-next-line no-alert
      window.alert("clicked");
    },
    children: "Activate me with click, Enter, or Space",
  },
};

export const InteractiveDiv: Story = {
  args: {
    onClick: () => {
      // eslint-disable-next-line no-alert
      window.alert("clicked");
    },
    children: "Div with onClick is auto-promoted to ARIA button",
  },
};

export const DisabledButton: Story = {
  args: {
    as: "button",
    disabled: true,
    children: "Disabled state",
  },
};
