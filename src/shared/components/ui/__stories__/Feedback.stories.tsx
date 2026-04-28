import type { Meta, StoryObj } from "@storybook/react-vite";
import InfoCallout from "../InfoCallout";
import LoadingState from "../LoadingState";
import ErrorState from "../ErrorState";
import { ResourceEmptyState } from "../ResourceEmptyState";
import StatusPill from "../StatusPill";

const meta: Meta = { title: "Primitives/Feedback" };
export default meta;

export const InfoCallouts: StoryObj = {
  render: () => (
    <div className="space-y-3 max-w-xl">
      <InfoCallout tone="info" title="Heads up">
        Trial expires in 3 days.
      </InfoCallout>
      <InfoCallout tone="success" title="Saved" onDismiss={() => undefined}>
        Dismissable success banner.
      </InfoCallout>
      <InfoCallout tone="warning" title="Region offline">
        Awaiting credentials.
      </InfoCallout>
      <InfoCallout tone="danger" title="Provisioning failed">
        Provider rejected the request.
      </InfoCallout>
    </div>
  ),
};

export const LoadingDefault: StoryObj<typeof LoadingState> = {
  render: () => <LoadingState message="Refreshing snapshots…" />,
};

export const LoadingInline: StoryObj<typeof LoadingState> = {
  render: () => <LoadingState variant="inline" message="Saving" size="sm" />,
};

export const ErrorWithRetry: StoryObj<typeof ErrorState> = {
  render: () => (
    <ErrorState
      onRetry={() => undefined}
      autoFocusRetry={false}
      code="UPSTREAM_502"
    />
  ),
};

export const Empty: StoryObj = {
  render: () => (
    <ResourceEmptyState
      title="No items yet"
      message="Provisioned items will appear here."
    />
  ),
};

export const StatusPillTones: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <StatusPill tone="success" label="active" />
      <StatusPill tone="warning" label="pending" />
      <StatusPill tone="danger" label="failed" />
      <StatusPill tone="info" label="info" />
      <StatusPill tone="neutral" label="unknown" />
    </div>
  ),
};
