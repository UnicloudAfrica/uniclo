import React, { useId, useMemo, useState } from "react";
import { Mail, Loader2, AlertTriangle, KeyRound, ExternalLink, HelpCircle } from "lucide-react";
import { StoryStep } from "@/shared/components/orbit";
import SelectableCardGroup from "@/shared/components/ui/SelectableCardGroup";
import {
  usePreviewMailFolders,
  useCreateMailMigration,
  useMailMigrationPricing,
  type MailProvider,
  type MailConfig,
  type MailImapConfig,
  type MailFolder,
} from "@/shared/hooks/resources";
import {
  MAIL_PROVIDER_PRESETS,
  getMailProviderPreset,
  type MailProviderPresetId,
} from "./mailProviderPresets";
import { useFetchWalletBalance } from "@/hooks/walletHooks";
import { formatCurrencyValue } from "@/utils/instanceCreationUtils";
import { getCurrencySymbol } from "@/utils/resource";

/**
 * MailMigrationWizard — a friendly 4-step "Move My Email" flow.
 *
 *   1. Where is your email now?   (source provider + creds)
 *   2. Where should it go?        (destination provider + creds)
 *   3. What should we move?       (folder checklist from preview-folders)
 *   4. Ready!                     (start the move)
 *
 * On a successful start it calls `onStarted(identifier)` so the parent page
 * can switch to the live progress view.
 */

export interface MailMigrationWizardProps {
  onStarted: (identifier: string) => void;
  onCancel: () => void;
}

interface ProviderCard {
  value: MailProvider;
  label: string;
  emoji: string;
  blurb: string;
}

const PROVIDERS: ProviderCard[] = [
  { value: "m365", label: "Microsoft 365", emoji: "🅼", blurb: "Outlook / Office 365 mailboxes." },
  { value: "gmail", label: "Gmail", emoji: "📧", blurb: "Gmail or Google Workspace." },
  { value: "imap", label: "Other email", emoji: "📮", blurb: "Any other provider or your own server." },
];

const EMPTY_IMAP: MailImapConfig = {
  host: "",
  port: 993,
  username: "",
  password: "",
  encryption: "ssl",
};

interface EndpointState {
  provider: MailProvider | null;
  imap: MailImapConfig;
  /** Which IMAP provider preset the user picked (auto-fills host/port/encryption). */
  imapPreset: MailProviderPresetId | null;
  connectionIdentifier: string;
}

const EMPTY_ENDPOINT: EndpointState = {
  provider: null,
  imap: EMPTY_IMAP,
  imapPreset: null,
  connectionIdentifier: "",
};

/** Build the API config for an endpoint once a provider is chosen. */
function toConfig(endpoint: EndpointState): MailConfig {
  if (endpoint.provider === "imap") {
    return {
      host: endpoint.imap.host.trim(),
      port: endpoint.imap.port,
      // For "Other email" we use the email address as the username.
      username: endpoint.imap.username.trim(),
      password: endpoint.imap.password,
      encryption: endpoint.imap.encryption,
    };
  }
  return { connection_identifier: endpoint.connectionIdentifier.trim() };
}

/** An endpoint is ready when a provider is chosen and its required fields are filled. */
function endpointIsValid(endpoint: EndpointState): boolean {
  if (!endpoint.provider) return false;
  if (endpoint.provider === "imap") {
    const { host, username, password, port } = endpoint.imap;
    return Boolean(host.trim() && username.trim() && password && port > 0);
  }
  return Boolean(endpoint.connectionIdentifier.trim());
}

function ProviderPicker({
  endpoint,
  onChange,
}: {
  endpoint: EndpointState;
  onChange: (next: EndpointState) => void;
}): React.JSX.Element {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-4">
      <SelectableCardGroup<MailProvider>
        ariaLabel="Choose where your email lives"
        columns={3}
        size="md"
        value={endpoint.provider}
        onChange={(value) => onChange({ ...endpoint, provider: value })}
        options={PROVIDERS.map((p) => ({
          value: p.value,
          label: p.label,
          description: p.blurb,
          icon: p.emoji,
        }))}
      />

      {endpoint.provider === "imap" && (
        <ImapPresetGuidance endpoint={endpoint} onChange={onChange} />
      )}

      {endpoint.provider === "imap" && endpoint.imapPreset && (
        <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Email address
            </label>
            <input
              type="email"
              autoComplete="email"
              value={endpoint.imap.username}
              onChange={(e) =>
                onChange({ ...endpoint, imap: { ...endpoint.imap, username: e.target.value } })
              }
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              type="password"
              autoComplete="off"
              value={endpoint.imap.password}
              onChange={(e) =>
                onChange({ ...endpoint, imap: { ...endpoint.imap, password: e.target.value } })
              }
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              🔒 Your password is encrypted and never shown again.
            </p>
          </div>

          <details
            open={showAdvanced || endpoint.imapPreset === "other"}
            onToggle={(e) => setShowAdvanced((e.target as HTMLDetailsElement).open)}
            className="rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <summary className="cursor-pointer text-gray-700 dark:text-gray-300">
              {endpoint.imapPreset === "other"
                ? "Server settings"
                : "Advanced — we filled this in for you"}
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Mail server (host)
                </label>
                <input
                  type="text"
                  value={endpoint.imap.host}
                  onChange={(e) =>
                    onChange({ ...endpoint, imap: { ...endpoint.imap, host: e.target.value } })
                  }
                  placeholder="imap.example.com"
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Port
                </label>
                <input
                  type="number"
                  min={1}
                  max={65535}
                  value={endpoint.imap.port}
                  onChange={(e) =>
                    onChange({
                      ...endpoint,
                      imap: { ...endpoint.imap, port: Number(e.target.value) || 0 },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Security
                </label>
                <select
                  value={endpoint.imap.encryption}
                  onChange={(e) =>
                    onChange({
                      ...endpoint,
                      imap: {
                        ...endpoint.imap,
                        encryption: e.target.value as MailImapConfig["encryption"],
                      },
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                >
                  <option value="ssl">SSL (most common)</option>
                  <option value="tls">TLS</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>
          </details>
        </div>
      )}

      {(endpoint.provider === "m365" || endpoint.provider === "gmail") && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
            Which connected account?
          </label>
          <input
            type="text"
            value={endpoint.connectionIdentifier}
            onChange={(e) => onChange({ ...endpoint, connectionIdentifier: e.target.value })}
            placeholder="Pick the account you connected earlier"
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            We use the account you already connected — no password needed here.
          </p>
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-900/10 dark:text-blue-200">
            <HelpCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Pick the account you already connected. Don&apos;t see it? You can connect one from{" "}
              <strong>Settings → Connected accounts</strong>, then come back here.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * ImapPresetGuidance — the friendly "Which email service is this?" picker plus
 * the calm App-Password / IMAP guidance for the chosen provider.
 *
 * Picking a preset auto-fills host/port/encryption so a non-technical user
 * never types a server name. "Other" leaves those blank so power users can fill
 * them in via the Advanced disclosure below.
 */
function ImapPresetGuidance({
  endpoint,
  onChange,
}: {
  endpoint: EndpointState;
  onChange: (next: EndpointState) => void;
}): React.JSX.Element {
  const legendId = useId();
  const preset = endpoint.imapPreset ? getMailProviderPreset(endpoint.imapPreset) : undefined;

  const pick = (id: MailProviderPresetId) => {
    const next = getMailProviderPreset(id);
    if (!next) return;
    onChange({
      ...endpoint,
      imapPreset: id,
      imap: {
        ...endpoint.imap,
        // Auto-fill the technical bits for real providers; "Other" keeps them
        // blank so the user types their own in Advanced.
        host: next.host ?? endpoint.imap.host,
        port: next.port ?? endpoint.imap.port,
        encryption: next.encryption ?? endpoint.imap.encryption,
      },
    });
  };

  return (
    <div className="space-y-3">
      <fieldset>
        <legend id={legendId} className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Which email service is this?
        </legend>
        <SelectableCardGroup<MailProviderPresetId>
          ariaLabelledBy={legendId}
          columns={3}
          size="sm"
          className="mt-2"
          value={endpoint.imapPreset}
          onChange={pick}
          options={MAIL_PROVIDER_PRESETS.map((p) => ({
            value: p.id,
            label: p.label,
            icon: p.emoji,
          }))}
        />
      </fieldset>

      {preset && preset.appPasswordSteps.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-100">
          <div className="flex items-start gap-2">
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div className="space-y-2">
              <p className="font-semibold">
                You&apos;ll need an App Password (not your normal password) — here&apos;s how:
              </p>
              <ol className="list-decimal space-y-1 pl-5">
                {preset.appPasswordSteps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
              {preset.helpUrl && (
                <a
                  href={preset.helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-amber-900 underline underline-offset-2 hover:text-amber-700 dark:text-amber-100 dark:hover:text-amber-200"
                >
                  {preset.helpLabel}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {endpoint.imapPreset === "other" && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          No problem — enter your mail server, port and security below. Your provider&apos;s help
          pages list these (search “{`<provider>`} IMAP settings”).
        </p>
      )}
    </div>
  );
}

export function MailMigrationWizard({
  onStarted,
  onCancel,
}: MailMigrationWizardProps): React.JSX.Element {
  const [step, setStep] = useState(1);
  const [source, setSource] = useState<EndpointState>(EMPTY_ENDPOINT);
  const [dest, setDest] = useState<EndpointState>(EMPTY_ENDPOINT);
  const [folders, setFolders] = useState<MailFolder[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewError, setPreviewError] = useState<string | null>(null);

  const preview = usePreviewMailFolders();
  const create = useCreateMailMigration();
  const pricing = useMailMigrationPricing();
  // Fetch the wallet in the same currency as the price so the pre-flight
  // balance check compares like-for-like.
  const wallet = useFetchWalletBalance(pricing.data?.currency ?? "NGN");

  // The wizard moves exactly one mailbox pair, so the estimated cost is one
  // per-mailbox price. `per_mailbox_cents` is in minor units; the wallet
  // `balance` is in major units, so divide by 100 to compare.
  const lowBalanceWarning = useMemo(() => {
    if (!pricing.data || !wallet.data) return null;
    if (typeof wallet.data.balance !== "number") return null;
    // Only warn when both sides are in the same currency — otherwise the
    // numbers aren't comparable and we'd risk a false alarm.
    if (wallet.data.currency !== pricing.data.currency) return null;
    const estimatedCost = pricing.data.per_mailbox_cents / 100;
    if (wallet.data.balance >= estimatedCost) return null;
    const symbol = getCurrencySymbol(wallet.data.currency);
    return {
      balanceFormatted: `${symbol}${formatCurrencyValue(wallet.data.balance)}`,
      costFormatted: pricing.data.per_mailbox_formatted,
    };
  }, [pricing.data, wallet.data]);

  const folderKey = (f: MailFolder) => f.path ?? f.name;
  const allSelected = folders.length > 0 && selected.size === folders.length;

  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  // Step 1 → 2 is a simple advance. Step 2 → 3 fetches folders from the source.
  const loadFoldersThenAdvance = async () => {
    setPreviewError(null);
    try {
      const result = await preview.mutateAsync({
        provider: source.provider as MailProvider,
        config: toConfig(source),
      });
      setFolders(result);
      setSelected(new Set(result.map(folderKey)));
      setStep(3);
    } catch (err) {
      setPreviewError(
        err instanceof Error && err.message && err.message !== "We couldn't connect"
          ? err.message
          : "We couldn't connect — double-check your email and password."
      );
    }
  };

  const toggleFolder = (key: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((current) =>
      current.size === folders.length ? new Set() : new Set(folders.map(folderKey))
    );
  };

  const startMove = async () => {
    const result = await create.mutateAsync({
      source_provider: source.provider as MailProvider,
      source_config: toConfig(source),
      dest_provider: dest.provider as MailProvider,
      dest_config: toConfig(dest),
      folders_selected: allSelected ? undefined : Array.from(selected),
    });
    if (result.identifier) onStarted(result.identifier);
  };

  const sourceLabel = useMemo(
    () => PROVIDERS.find((p) => p.value === source.provider)?.label ?? "your email",
    [source.provider]
  );
  const destLabel = useMemo(
    () => PROVIDERS.find((p) => p.value === dest.provider)?.label ?? "the new place",
    [dest.provider]
  );

  return (
    <div className="space-y-4">
      {step === 1 && (
        <StoryStep
          stepNumber={1}
          totalSteps={4}
          title="Where is your email now?"
          blurb="Pick where your email lives today. We'll connect to it and get everything ready to move."
          onBack={onCancel}
          backLabel="Cancel"
          onNext={() => setStep(2)}
          nextDisabled={!endpointIsValid(source)}
        >
          <ProviderPicker endpoint={source} onChange={setSource} />
        </StoryStep>
      )}

      {step === 2 && (
        <StoryStep
          stepNumber={2}
          totalSteps={4}
          title="Where should it go?"
          blurb="Now pick the new home for your email. We'll copy everything over — your old mailbox stays untouched."
          onBack={goBack}
          onNext={loadFoldersThenAdvance}
          nextDisabled={!endpointIsValid(dest) || preview.isPending}
          nextLabel={preview.isPending ? "Connecting…" : "Got it"}
        >
          <ProviderPicker endpoint={dest} onChange={setDest} />
          {previewError && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800/40 dark:bg-red-900/10 dark:text-red-200"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{previewError}</span>
            </div>
          )}
        </StoryStep>
      )}

      {step === 3 && (
        <StoryStep
          stepNumber={3}
          totalSteps={4}
          title="What should we move?"
          blurb="Everything's selected by default. Untick anything you'd rather leave behind."
          onBack={goBack}
          onNext={() => setStep(4)}
          nextDisabled={selected.size === 0}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                We found {folders.length} folder{folders.length === 1 ? "" : "s"} 📬
              </p>
              <button
                type="button"
                onClick={toggleAll}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-primary-300 dark:hover:bg-primary-900/20"
              >
                {allSelected ? "Clear all" : "Select all"}
              </button>
            </div>
            <ul className="space-y-2">
              {folders.map((f) => {
                const key = folderKey(f);
                return (
                  <li key={key}>
                    <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-900">
                      <input
                        type="checkbox"
                        checked={selected.has(key)}
                        onChange={() => toggleFolder(key)}
                      />
                      <span className="flex-1 font-medium text-gray-900 dark:text-gray-100">
                        {f.name}
                      </span>
                      {typeof f.message_count === "number" && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {f.message_count} message{f.message_count === 1 ? "" : "s"}
                        </span>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        </StoryStep>
      )}

      {step === 4 && (
        <StoryStep
          stepNumber={4}
          totalSteps={4}
          title="Ready!"
          blurb={`We'll move ${selected.size} folder${
            selected.size === 1 ? "" : "s"
          } from ${sourceLabel} to ${destLabel}. Your old email stays exactly where it is.`}
          onBack={goBack}
          onNext={startMove}
          nextDisabled={create.isPending}
          nextLabel={create.isPending ? "Starting…" : "Start the move ✨"}
          isFinalStep
          reassurance="You can safely close this once it starts — the move keeps going on its own."
        >
          <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white">
              {create.isPending ? (
                <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
              ) : (
                <Mail className="h-6 w-6" aria-hidden="true" />
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Moving <strong className="text-gray-900 dark:text-gray-100">{sourceLabel}</strong> →{" "}
              <strong className="text-gray-900 dark:text-gray-100">{destLabel}</strong>
            </p>
          </div>

          {pricing.isLoading ? (
            <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">Checking the price…</p>
          ) : (
            pricing.data && (
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                💸 This will cost{" "}
                <strong className="text-gray-900 dark:text-gray-100">
                  {pricing.data.per_mailbox_formatted}
                </strong>{" "}
                for this mailbox — you'll only be charged once it finishes.
              </p>
            )
          )}

          {lowBalanceWarning && (
            <div
              role="alert"
              className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-100"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Your wallet balance (
                <strong>{lowBalanceWarning.balanceFormatted}</strong>) is below the estimated cost (
                <strong>{lowBalanceWarning.costFormatted}</strong>). You can still start the move, but
                add some money to your wallet so it doesn&apos;t pause partway through.
              </span>
            </div>
          )}
        </StoryStep>
      )}
    </div>
  );
}

export default MailMigrationWizard;
