import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MailMigrationWizard from "../MailMigrationWizard";
import MailMigrationProgress from "../MailMigrationProgress";
import MoveMyEmailPanel from "../MoveMyEmailPanel";

// jsdom doesn't ship matchMedia, which orbit's usePrefersReducedMotion needs.
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

const mocks = vi.hoisted(() => ({
  previewMutateAsync: vi.fn(),
  previewPending: false,
  createMutateAsync: vi.fn(),
  createPending: false,
  cancelMutateAsync: vi.fn(),
  migrations: [] as unknown[],
  migration: {} as Record<string, unknown>,
  pricingData: null as Record<string, unknown> | null,
  pricingLoading: false,
  walletData: null as Record<string, unknown> | null,
}));

vi.mock("@/shared/hooks/resources", () => ({
  usePreviewMailFolders: () => ({
    mutateAsync: mocks.previewMutateAsync,
    isPending: mocks.previewPending,
  }),
  useCreateMailMigration: () => ({
    mutateAsync: mocks.createMutateAsync,
    isPending: mocks.createPending,
  }),
  useCancelMailMigration: () => ({ mutateAsync: mocks.cancelMutateAsync }),
  useMailMigrations: () => ({ data: mocks.migrations, isLoading: false }),
  useMailMigration: () => ({ data: mocks.migration, isLoading: false }),
  useMailMigrationPricing: () => ({ data: mocks.pricingData, isLoading: mocks.pricingLoading }),
}));

vi.mock("@/hooks/walletHooks", () => ({
  useFetchWalletBalance: () => ({ data: mocks.walletData }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.previewPending = false;
  mocks.createPending = false;
  mocks.migrations = [];
  mocks.migration = {};
  mocks.pricingData = null;
  mocks.pricingLoading = false;
  mocks.walletData = null;
  mocks.previewMutateAsync.mockResolvedValue([
    { name: "Inbox", path: "INBOX", message_count: 120 },
    { name: "Sent", path: "Sent", message_count: 40 },
  ]);
  mocks.createMutateAsync.mockResolvedValue({ identifier: "mig-1", status: "running" });
});

/**
 * The IMAP "Which email service is this?" preset cards live inside a
 * <fieldset> and are radios (SelectableCardGroup) just like the top-level
 * provider cards. Scope the query to that fieldset so we don't accidentally
 * match the "Gmail" provider card.
 */
function pickImapPreset(name: RegExp): HTMLElement {
  const legend = screen.getByText("Which email service is this?");
  const fieldset = legend.closest("fieldset") as HTMLElement;
  return within(fieldset).getByRole("radio", { name });
}

describe("MailMigrationWizard", () => {
  it("renders step 1 asking where the email is now", () => {
    render(<MailMigrationWizard onStarted={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("Where is your email now?")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Microsoft 365/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Gmail/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Other email/ })).toBeInTheDocument();
  });

  it("reveals friendly IMAP fields when 'Other email' is chosen", async () => {
    const user = userEvent.setup();
    render(<MailMigrationWizard onStarted={vi.fn()} onCancel={vi.fn()} />);

    await user.click(screen.getByRole("radio", { name: /Other email/ }));
    // Pick a provider preset to reveal the email/password fields.
    await user.click(pickImapPreset(/Gmail/));

    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByText(/encrypted and never shown again/i)).toBeInTheDocument();
  });

  it("auto-fills host/port and shows App Password steps when the Gmail preset is picked", async () => {
    const user = userEvent.setup();
    render(<MailMigrationWizard onStarted={vi.fn()} onCancel={vi.fn()} />);

    await user.click(screen.getByRole("radio", { name: /Other email/ }));
    // The IMAP preset picker offers Gmail; selecting it auto-fills server settings.
    await user.click(pickImapPreset(/Gmail/));

    // App Password guidance + official help link appear.
    expect(
      screen.getByText(/You'll need an App Password \(not your normal password\)/i)
    ).toBeInTheDocument();
    const helpLink = screen.getByRole("link", { name: /App Password/i });
    expect(helpLink).toHaveAttribute("href", "https://support.google.com/mail/answer/185833");
    expect(helpLink).toHaveAttribute("target", "_blank");
    expect(helpLink).toHaveAttribute("rel", "noopener noreferrer");

    // Open the "Advanced — we filled this in for you" disclosure and verify values.
    await user.click(screen.getByText(/we filled this in for you/i));
    expect(screen.getByPlaceholderText("imap.example.com")).toHaveValue("imap.gmail.com");
    expect(screen.getByRole("spinbutton")).toHaveValue(993);
  });

  it("reveals manual host/port fields when the 'Other' preset is chosen", async () => {
    const user = userEvent.setup();
    render(<MailMigrationWizard onStarted={vi.fn()} onCancel={vi.fn()} />);

    await user.click(screen.getByRole("radio", { name: /Other email/ }));
    await user.click(screen.getByRole("radio", { name: /Other \/ my own server/ }));

    // Manual server fields are visible (disclosure open) and blank.
    expect(screen.getByPlaceholderText("imap.example.com")).toHaveValue("");
    expect(
      screen.queryByText(/You'll need an App Password/i)
    ).not.toBeInTheDocument();
  });

  it("submits the IMAP payload with host/port/username/password/encryption", async () => {
    const user = userEvent.setup();
    render(<MailMigrationWizard onStarted={vi.fn()} onCancel={vi.fn()} />);

    // Source = Other email → Gmail preset (auto-fills host/port/encryption).
    await user.click(screen.getByRole("radio", { name: /Other email/ }));
    await user.click(pickImapPreset(/Gmail/));
    await user.type(screen.getByPlaceholderText("you@example.com"), "me@gmail.com");
    await user.type(screen.getByPlaceholderText("••••••••"), "app-pass-1234");
    await user.click(screen.getByRole("button", { name: /Got it/ }));

    // Dest = Microsoft 365 connected account.
    await user.click(screen.getByRole("radio", { name: /Microsoft 365/ }));
    await user.type(
      screen.getByPlaceholderText("Pick the account you connected earlier"),
      "m365-conn-1"
    );
    await user.click(screen.getByRole("button", { name: /Got it/ }));

    expect(mocks.previewMutateAsync).toHaveBeenCalledWith({
      provider: "imap",
      config: {
        host: "imap.gmail.com",
        port: 993,
        username: "me@gmail.com",
        password: "app-pass-1234",
        encryption: "ssl",
      },
    });
  });

  it("advances through provider selection, previews folders, and renders a checklist", async () => {
    const user = userEvent.setup();
    render(<MailMigrationWizard onStarted={vi.fn()} onCancel={vi.fn()} />);

    // Step 1: source = Gmail (connection identifier)
    await user.click(screen.getByRole("radio", { name: /Gmail/ }));
    await user.type(
      screen.getByPlaceholderText("Pick the account you connected earlier"),
      "gmail-conn-1"
    );
    await user.click(screen.getByRole("button", { name: /Got it/ }));

    // Step 2: dest = Microsoft 365
    expect(screen.getByText("Where should it go?")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /Microsoft 365/ }));
    await user.type(
      screen.getByPlaceholderText("Pick the account you connected earlier"),
      "m365-conn-1"
    );
    await user.click(screen.getByRole("button", { name: /Got it/ }));

    // preview-folders was called with the source provider + config
    expect(mocks.previewMutateAsync).toHaveBeenCalledWith({
      provider: "gmail",
      config: { connection_identifier: "gmail-conn-1" },
    });

    // Step 3: folder checklist + cheerful summary
    expect(await screen.findByText(/We found 2 folders/)).toBeInTheDocument();
    expect(screen.getByText("Inbox")).toBeInTheDocument();
    expect(screen.getByText("Sent")).toBeInTheDocument();
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.every((c) => (c as HTMLInputElement).checked)).toBe(true);
  });

  it("POSTs the correct payload shape and hands off the identifier", async () => {
    const onStarted = vi.fn();
    const user = userEvent.setup();
    render(<MailMigrationWizard onStarted={onStarted} onCancel={vi.fn()} />);

    await user.click(screen.getByRole("radio", { name: /Gmail/ }));
    await user.type(
      screen.getByPlaceholderText("Pick the account you connected earlier"),
      "gmail-conn-1"
    );
    await user.click(screen.getByRole("button", { name: /Got it/ }));

    await user.click(screen.getByRole("radio", { name: /Microsoft 365/ }));
    await user.type(
      screen.getByPlaceholderText("Pick the account you connected earlier"),
      "m365-conn-1"
    );
    await user.click(screen.getByRole("button", { name: /Got it/ }));

    await screen.findByText(/We found 2 folders/);
    await user.click(screen.getByRole("button", { name: /Got it/ })); // step 3 -> 4

    expect(screen.getByText("Ready!")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Start the move/ }));

    // All folders selected -> folders_selected omitted (move everything)
    expect(mocks.createMutateAsync).toHaveBeenCalledWith({
      source_provider: "gmail",
      source_config: { connection_identifier: "gmail-conn-1" },
      dest_provider: "m365",
      dest_config: { connection_identifier: "m365-conn-1" },
      folders_selected: undefined,
    });
    expect(onStarted).toHaveBeenCalledWith("mig-1");
  });

  const advanceToReadyStep = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole("radio", { name: /Gmail/ }));
    await user.type(
      screen.getByPlaceholderText("Pick the account you connected earlier"),
      "gmail-conn-1"
    );
    await user.click(screen.getByRole("button", { name: /Got it/ }));

    await user.click(screen.getByRole("radio", { name: /Microsoft 365/ }));
    await user.type(
      screen.getByPlaceholderText("Pick the account you connected earlier"),
      "m365-conn-1"
    );
    await user.click(screen.getByRole("button", { name: /Got it/ }));

    await screen.findByText(/We found 2 folders/);
    await user.click(screen.getByRole("button", { name: /Got it/ })); // step 3 -> 4
    expect(screen.getByText("Ready!")).toBeInTheDocument();
  };

  it("shows a friendly price line on the Ready step when pricing is available", async () => {
    mocks.pricingData = {
      per_mailbox_cents: 1200,
      per_mailbox_formatted: "$12.00",
      currency: "USD",
    };
    const user = userEvent.setup();
    render(<MailMigrationWizard onStarted={vi.fn()} onCancel={vi.fn()} />);

    await advanceToReadyStep(user);

    expect(screen.getByText(/This will cost/)).toHaveTextContent(
      /\$12\.00 for this mailbox — you'll only be charged once it finishes/
    );
  });

  it("warns on the Ready step when the wallet balance is below the estimated cost", async () => {
    mocks.pricingData = {
      per_mailbox_cents: 1200,
      per_mailbox_formatted: "$12.00",
      currency: "USD",
    };
    mocks.walletData = { balance: 5, currency: "USD" }; // $5 < $12
    const user = userEvent.setup();
    render(<MailMigrationWizard onStarted={vi.fn()} onCancel={vi.fn()} />);

    await advanceToReadyStep(user);

    const warning = screen.getByRole("alert");
    expect(warning).toHaveTextContent(/Your wallet balance/i);
    expect(warning).toHaveTextContent(/below the estimated cost/i);
    // Warning, not a gate — Start stays enabled.
    expect(screen.getByRole("button", { name: /Start the move/ })).toBeEnabled();
  });

  it("does not warn when the wallet balance covers the estimated cost", async () => {
    mocks.pricingData = {
      per_mailbox_cents: 1200,
      per_mailbox_formatted: "$12.00",
      currency: "USD",
    };
    mocks.walletData = { balance: 50, currency: "USD" }; // $50 >= $12
    const user = userEvent.setup();
    render(<MailMigrationWizard onStarted={vi.fn()} onCancel={vi.fn()} />);

    await advanceToReadyStep(user);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText(/below the estimated cost/i)).not.toBeInTheDocument();
  });

  it("degrades gracefully — Start still works and no error when pricing is missing", async () => {
    mocks.pricingData = null; // pricing failed / returned nothing
    const user = userEvent.setup();
    render(<MailMigrationWizard onStarted={vi.fn()} onCancel={vi.fn()} />);

    await advanceToReadyStep(user);

    expect(screen.queryByText(/This will cost/)).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Start the move/ })).toBeEnabled();
  });

  it("shows a subtle placeholder (not an error) while pricing loads", async () => {
    mocks.pricingLoading = true;
    const user = userEvent.setup();
    render(<MailMigrationWizard onStarted={vi.fn()} onCancel={vi.fn()} />);

    await advanceToReadyStep(user);

    expect(screen.getByText(/Checking the price/)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Start the move/ })).toBeEnabled();
  });

  it("shows a friendly error when preview fails (bad creds)", async () => {
    mocks.previewMutateAsync.mockRejectedValueOnce(new Error("We couldn't connect"));
    const user = userEvent.setup();
    render(<MailMigrationWizard onStarted={vi.fn()} onCancel={vi.fn()} />);

    await user.click(screen.getByRole("radio", { name: /Gmail/ }));
    await user.type(
      screen.getByPlaceholderText("Pick the account you connected earlier"),
      "gmail-conn-1"
    );
    await user.click(screen.getByRole("button", { name: /Got it/ }));

    await user.click(screen.getByRole("radio", { name: /Microsoft 365/ }));
    await user.type(
      screen.getByPlaceholderText("Pick the account you connected earlier"),
      "m365-conn-1"
    );
    await user.click(screen.getByRole("button", { name: /Got it/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /double-check your email and password/i
    );
    // Still on step 2 — did not advance
    expect(screen.getByText("Where should it go?")).toBeInTheDocument();
  });
});

describe("MailMigrationProgress", () => {
  it("renders live counts from a polled response", () => {
    mocks.migration = {
      identifier: "mig-1",
      status: "running",
      total_messages: 100,
      migrated_messages: 25,
      skipped_messages: 2,
      failed_messages: 1,
    };
    render(<MailMigrationProgress identifier="mig-1" onBack={vi.fn()} />);

    expect(screen.getByText("25%")).toBeInTheDocument();
    const moved = screen.getByText("Moved").closest("div") as HTMLElement;
    expect(within(moved).getByText("25")).toBeInTheDocument();
    expect(screen.getByText(/Sit back/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel this move/ })).toBeInTheDocument();
  });

  it("celebrates on completion", () => {
    mocks.migration = {
      identifier: "mig-1",
      status: "completed",
      total_messages: 100,
      migrated_messages: 100,
    };
    render(<MailMigrationProgress identifier="mig-1" onBack={vi.fn()} />);
    expect(screen.getByText(/All done! We safely moved 100 emails/)).toBeInTheDocument();
  });
});

describe("MoveMyEmailPanel", () => {
  it("shows an empty state and opens the wizard from the CTA", async () => {
    const user = userEvent.setup();
    render(<MoveMyEmailPanel />);

    expect(screen.getByText("No email moves yet")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Move my email/ }));
    expect(screen.getByText("Where is your email now?")).toBeInTheDocument();
  });

  it("lists existing migrations and opens progress on click", async () => {
    mocks.migrations = [
      {
        identifier: "mig-9",
        status: "completed",
        source_provider: "gmail",
        dest_provider: "m365",
        total_messages: 50,
        migrated_messages: 50,
      },
    ];
    mocks.migration = { identifier: "mig-9", status: "completed", total_messages: 50, migrated_messages: 50 };
    const user = userEvent.setup();
    render(<MoveMyEmailPanel />);

    const row = screen.getByRole("button", { name: /Gmail.*Microsoft 365/ });
    await user.click(row);
    expect(screen.getByText("Your email move")).toBeInTheDocument();
  });
});
