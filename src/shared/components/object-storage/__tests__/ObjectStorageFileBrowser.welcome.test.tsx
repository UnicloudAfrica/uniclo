/**
 * Welcome-state (no silo selected) behaviour for ObjectStorageFileBrowser.
 *
 * The welcome branch is pure prop-callbacks — no network — so the heavy
 * collaborators are stubbed and no QueryClient is needed.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ObjectStorageFileBrowser from "../ObjectStorageFileBrowser";

vi.mock("@/services/objectStorageApi", () => ({ default: {} }));
vi.mock("@/utils/toastUtil", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("../DropzoneUploader", () => ({ default: () => null }));

const baseProps = {
  accountId: "acc-1",
  bucketName: null,
  buckets: [],
};

const getCreateButton = () =>
  screen.getByRole("button", { name: /create silo/i });

describe("ObjectStorageFileBrowser — welcome state", () => {
  it("creates a silo and lands the user straight in it", async () => {
    const onCreateBucket = vi.fn().mockResolvedValue(undefined);
    const onSelectBucket = vi.fn();
    render(
      <ObjectStorageFileBrowser
        {...baseProps}
        onCreateBucket={onCreateBucket}
        onSelectBucket={onSelectBucket}
      />,
    );

    fireEvent.change(screen.getByLabelText(/silo name/i), {
      target: { value: "my-silo" },
    });
    fireEvent.click(getCreateButton());

    await waitFor(() => expect(onCreateBucket).toHaveBeenCalledWith("my-silo"));
    await waitFor(() => expect(onSelectBucket).toHaveBeenCalledWith("my-silo"));
  });

  it("disables the Create button while the name is empty", () => {
    render(<ObjectStorageFileBrowser {...baseProps} onCreateBucket={vi.fn()} />);
    expect(getCreateButton()).toBeDisabled();
  });

  it("sanitizes the silo name to lowercase url-safe characters", () => {
    render(<ObjectStorageFileBrowser {...baseProps} onCreateBucket={vi.fn()} />);
    const input = screen.getByLabelText(/silo name/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "My Silo!" } });
    expect(input.value).toBe("mysilo");
  });

  it("does not double-submit while a create is in flight", async () => {
    const onCreateBucket = vi.fn(() => new Promise<void>(() => {})); // never resolves
    render(<ObjectStorageFileBrowser {...baseProps} onCreateBucket={onCreateBucket} />);

    fireEvent.change(screen.getByLabelText(/silo name/i), {
      target: { value: "abc" },
    });
    const button = getCreateButton();
    fireEvent.click(button);

    // After the first click the button flips to a disabled "Creating…" state.
    await waitFor(() => expect(button).toBeDisabled());
    fireEvent.click(button);
    expect(onCreateBucket).toHaveBeenCalledTimes(1);
  });

  describe("provisioning state (account not yet ready)", () => {
    it("shows a provisioning notice instead of the create form", () => {
      render(
        <ObjectStorageFileBrowser
          {...baseProps}
          accountReady={false}
          onCreateBucket={vi.fn()}
        />,
      );
      expect(screen.getByText(/provisioning in progress/i)).toBeInTheDocument();
      // The create form must NOT be offered while provisioning.
      expect(screen.queryByLabelText(/silo name/i)).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /create silo/i })).not.toBeInTheDocument();
    });

    it("lets the user re-check status via onRefresh", () => {
      const onRefresh = vi.fn();
      render(
        <ObjectStorageFileBrowser
          {...baseProps}
          accountReady={false}
          onCreateBucket={vi.fn()}
          onRefresh={onRefresh}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: /refresh status/i }));
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it("shows a failed state (not a spinner) when provisioning failed", () => {
      const onRefresh = vi.fn();
      render(
        <ObjectStorageFileBrowser
          {...baseProps}
          accountReady={false}
          provisioningFailed={true}
          onCreateBucket={vi.fn()}
          onRefresh={onRefresh}
        />,
      );
      expect(screen.getByText(/finish setting up this account/i)).toBeInTheDocument();
      // Not the in-progress spinner, and no create form.
      expect(screen.queryByText(/provisioning in progress/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/silo name/i)).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /refresh status/i }));
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it("shows the create form once the account is ready", () => {
      render(
        <ObjectStorageFileBrowser
          {...baseProps}
          accountReady={true}
          onCreateBucket={vi.fn()}
        />,
      );
      expect(screen.getByLabelText(/silo name/i)).toBeInTheDocument();
      expect(screen.queryByText(/provisioning in progress/i)).not.toBeInTheDocument();
    });
  });

  describe("card honesty — a card renders only when its action is wired", () => {
    it("hides the credentials card when onShowCredentials is absent", () => {
      render(<ObjectStorageFileBrowser {...baseProps} onCreateBucket={vi.fn()} />);
      expect(screen.queryByText(/view s3 credentials/i)).not.toBeInTheDocument();
    });

    it("shows + fires the credentials card when wired", () => {
      const onShowCredentials = vi.fn();
      render(
        <ObjectStorageFileBrowser
          {...baseProps}
          onCreateBucket={vi.fn()}
          onShowCredentials={onShowCredentials}
        />,
      );
      fireEvent.click(screen.getByText(/view s3 credentials/i));
      expect(onShowCredentials).toHaveBeenCalledTimes(1);
    });

    it("shows + fires the add-storage card when wired", () => {
      const onAddStorage = vi.fn();
      render(
        <ObjectStorageFileBrowser
          {...baseProps}
          onCreateBucket={vi.fn()}
          onAddStorage={onAddStorage}
        />,
      );
      fireEvent.click(screen.getByText(/add more storage/i));
      expect(onAddStorage).toHaveBeenCalledTimes(1);
    });

    it("renders the docs card as a safe external link only when docsUrl is set", () => {
      const { rerender } = render(
        <ObjectStorageFileBrowser {...baseProps} onCreateBucket={vi.fn()} />,
      );
      expect(screen.queryByText(/read the s3 docs/i)).not.toBeInTheDocument();

      rerender(
        <ObjectStorageFileBrowser
          {...baseProps}
          onCreateBucket={vi.fn()}
          docsUrl="/docs/object-storage"
        />,
      );
      const link = screen.getByRole("link", { name: /read the s3 docs/i });
      expect(link).toHaveAttribute("href", "/docs/object-storage");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noreferrer");
    });

    it("offers an 'Open an existing Silo' shortcut only when silos exist", () => {
      const onSelectBucket = vi.fn();
      const { rerender } = render(
        <ObjectStorageFileBrowser
          {...baseProps}
          onCreateBucket={vi.fn()}
          onSelectBucket={onSelectBucket}
        />,
      );
      expect(screen.queryByText(/open an existing silo/i)).not.toBeInTheDocument();

      rerender(
        <ObjectStorageFileBrowser
          {...baseProps}
          buckets={[{ id: "1", name: "logs" }]}
          onCreateBucket={vi.fn()}
          onSelectBucket={onSelectBucket}
        />,
      );
      fireEvent.click(screen.getByText(/open an existing silo/i));
      expect(onSelectBucket).toHaveBeenCalledWith("logs");
    });
  });
});
