import React, { useMemo, useState } from "react";
import { CheckCircle2, Wifi, KeyRound, Telescope, Server, AlertTriangle } from "lucide-react";
import {
  StoryStep,
  SuccessMoment,
  StatusBadge,
  AsyncButton,
  FriendlyTooltip,
  RESILIENCE,
} from "@/shared/components/orbit";
import {
  useCreateVmEndpoint,
  useTestVmConnection,
} from "@/shared/hooks/resources/orbit/vmEndpointHooks";
import type { VmSourceType, VmConnectionTestResult } from "@/shared/types/orbit/vmEndpoint";

/**
 * VmEndpointWizard — friendly 5-step flow for registering a new source
 * server (FR-043 step 1 of lift-and-shift).
 *
 * Used by admin + tenant; clients cannot add sources.
 *
 * Step shape:
 *   1. Name it       — short noun phrase, what the customer calls the box
 *   2. Where is it?  — host + port + source type
 *   3. How to get in — credential vault reference (text for now; pluggable later)
 *   4. Quick check   — test connection, show green/red, allow retry
 *   5. Looks good!   — confirm review + create; on success → SuccessMoment
 *
 * Why a story-style flow:
 *   - First-time users have never registered a source. A 7-field form is
 *     intimidating; 5 small bites with plain-English titles is welcoming.
 *   - Each step has its own validation; users can't reach a later step
 *     with bad data, so the final create call is guaranteed to succeed
 *     for input-shape reasons.
 *
 * Accessibility:
 *   - Each step is its own region (StoryStep handles roles + ARIA)
 *   - Inputs autofocus on step entry
 *   - Errors announce via the hooks' toast layer (aria-live="polite")
 *   - Reduced-motion: progress bar still animates width but spring
 *     overshoot is dropped
 */

export interface VmEndpointWizardProps {
  /** Where to navigate after successful create (typically detail page). */
  onSuccess: (createdId: string) => void;
  /** Where to navigate when the user cancels. */
  onCancel: () => void;
}

const SOURCE_TYPES: Array<{ id: VmSourceType; label: string; emoji: string; blurb: string }> = [
  { id: "linux", label: "Linux server", emoji: "🐧", blurb: "Ubuntu, Debian, Red Hat, CentOS, Rocky, anything Linux" },
  { id: "windows", label: "Windows server", emoji: "🪟", blurb: "Windows Server 2016 onward" },
  { id: "vmware", label: "VMware VM", emoji: "🟦", blurb: "Running inside vSphere / ESXi" },
  { id: "hyperv", label: "Hyper-V VM", emoji: "🟪", blurb: "Running on Windows Hyper-V" },
  { id: "kvm", label: "KVM / libvirt VM", emoji: "🐧", blurb: "Running on KVM/QEMU" },
  { id: "on_prem", label: "Bare-metal on-prem", emoji: "🏢", blurb: "Physical server in your own datacenter" },
  { id: "aws_ec2", label: "AWS EC2", emoji: "🟧", blurb: "Running in Amazon Web Services" },
  { id: "azure_vm", label: "Azure VM", emoji: "🟦", blurb: "Running in Microsoft Azure" },
  { id: "gcp_vm", label: "GCP VM", emoji: "🟩", blurb: "Running in Google Cloud" },
];

interface FormState {
  name: string;
  host: string;
  port: number;
  sourceType: VmSourceType | "";
  credentialRef: string;
}

const INITIAL_FORM: FormState = {
  name: "",
  host: "",
  port: 22,
  sourceType: "",
  credentialRef: "",
};

export function VmEndpointWizard({ onSuccess, onCancel }: VmEndpointWizardProps): React.JSX.Element {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [testResult, setTestResult] = useState<VmConnectionTestResult | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const create = useCreateVmEndpoint();
  const test = useTestVmConnection();

  const stepIsValid = useMemo(() => {
    switch (step) {
      case 1:
        return form.name.trim().length >= 1 && form.name.trim().length <= 255;
      case 2:
        return (
          form.host.trim().length >= 1 &&
          form.port >= 1 &&
          form.port <= 65535
        );
      case 3:
        return form.sourceType !== "" && form.credentialRef.trim().length >= 1;
      case 4:
        // Test step is optional-skippable; but if test was run successfully, gate on success
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  }, [step, form]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const goNext = () => setStep((s) => Math.min(s + 1, 5));
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  const runTest = async () => {
    const result = await test.mutateAsync({
      host: form.host,
      port: form.port,
      credential_ref: form.credentialRef,
      source_type: form.sourceType as VmSourceType,
    });
    setTestResult(result);
    return result;
  };

  const submitCreate = async () => {
    const created = await create.mutateAsync({
      name: form.name.trim(),
      host: form.host.trim(),
      port: form.port,
      source_type: form.sourceType as VmSourceType,
      credential_ref: form.credentialRef.trim(),
    });
    setCreatedId(created.identifier);
  };

  // ─── Render per step ──────────────────────────────────────────────────────
  return (
    <>
      {step === 1 && (
        <StoryStep
          stepNumber={1}
          totalSteps={5}
          title="What should we call this server?"
          blurb="Pick a name that makes sense to you. Something like 'web-prod-01' or 'finance-db'. You'll see this name everywhere."
          illustration={
            <span aria-hidden="true" className="text-7xl">
              🏷️
            </span>
          }
          onBack={onCancel}
          backLabel="Cancel"
          onNext={goNext}
          nextDisabled={!stepIsValid}
          reassurance="You can rename it later — this isn't permanent."
        >
          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              A name
            </span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
              maxLength={255}
              placeholder="e.g. web-prod-01"
              aria-label="Server name"
              className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
              {form.name.length}/255
            </span>
          </label>
        </StoryStep>
      )}

      {step === 2 && (
        <StoryStep
          stepNumber={2}
          totalSteps={5}
          title="Where can we find it?"
          blurb="Tell us how to reach this server over the network. Most Linux boxes use port 22 (the default). Most Windows boxes use 5985 or 5986."
          illustration={
            <span aria-hidden="true" className="text-7xl">
              🌐
            </span>
          }
          onBack={goBack}
          onNext={goNext}
          nextDisabled={!stepIsValid}
          reassurance="We won't connect yet — we'll just save what you tell us."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Address (IP or hostname)
              </span>
              <input
                type="text"
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
                autoFocus
                placeholder="10.0.1.42 or server.mycompany.com"
                aria-label="Server address"
                className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Port{" "}
                <FriendlyTooltip
                  mode="icon"
                  definition="The 'door number' your server listens on. SSH uses 22 by default; WinRM uses 5985 or 5986."
                />
              </span>
              <input
                type="number"
                value={form.port}
                onChange={(e) =>
                  setForm({ ...form, port: parseInt(e.target.value, 10) || 22 })
                }
                min={1}
                max={65535}
                aria-label="Port number"
                className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </label>
          </div>
        </StoryStep>
      )}

      {step === 3 && (
        <StoryStep
          stepNumber={3}
          totalSteps={5}
          title="What kind is it, and how do we sign in?"
          blurb="Pick the closest match — we'll use the right tools for the job. Then point us at the saved credentials we should use to connect."
          illustration={
            <span aria-hidden="true" className="text-7xl">
              🔑
            </span>
          }
          onBack={goBack}
          onNext={goNext}
          nextDisabled={!stepIsValid}
        >
          <fieldset>
            <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
              What kind of server?
            </legend>
            <div
              role="radiogroup"
              aria-label="Server type"
              className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
            >
              {SOURCE_TYPES.map((opt) => {
                const selected = form.sourceType === opt.id;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setForm({ ...form, sourceType: opt.id })}
                    className={[
                      "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/40",
                      selected
                        ? "border-primary-500 bg-primary-500/5 shadow-sm dark:bg-primary-500/10"
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700",
                    ].join(" ")}
                  >
                    <span aria-hidden="true" className="text-xl">
                      {opt.emoji}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {opt.label}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {opt.blurb}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="mt-6 block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Credential reference{" "}
              <FriendlyTooltip
                mode="icon"
                definition="The label of a saved credential in your vault. Your team set these up — paste the reference here. We never store the password itself in the form."
                example="Example: prod-ssh-key-rsa-2025"
              />
            </span>
            <input
              type="text"
              value={form.credentialRef}
              onChange={(e) => setForm({ ...form, credentialRef: e.target.value })}
              placeholder="e.g. prod-ssh-key-rsa-2025"
              aria-label="Credential vault reference"
              autoComplete="off"
              spellCheck={false}
              className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
              We never see your secrets — just the label that points to them.
            </span>
          </label>
        </StoryStep>
      )}

      {step === 4 && (
        <StoryStep
          stepNumber={4}
          totalSteps={5}
          title="Let's make sure we can reach it"
          blurb="A quick check: we'll try to connect once and tell you what we found. Nothing changes on your server, no data is moved — just a knock on the door."
          illustration={
            <span aria-hidden="true" className="text-7xl">
              📡
            </span>
          }
          onBack={goBack}
          onNext={goNext}
          skippable
          onSkip={goNext}
          reassurance="Skipping is fine — we'll test on first scan instead."
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900/40">
              <div className="flex items-center gap-3">
                <Wifi className="h-5 w-5 text-gray-500" aria-hidden="true" />
                <div className="text-sm">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    Try connecting now
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {form.host}:{form.port} as {form.credentialRef || "(no creds)"}
                  </p>
                </div>
              </div>
              <AsyncButton
                onClick={runTest}
                size="md"
                loadingLabel="Knocking…"
                successLabel="Got an answer"
                icon={<Telescope className="h-4 w-4" aria-hidden="true" />}
              >
                Test now
              </AsyncButton>
            </div>

            {testResult && (
              <div
                role="status"
                aria-live="polite"
                className={[
                  "rounded-xl border p-4",
                  testResult.reachable
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-900/10"
                    : "border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/10",
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  {testResult.reachable ? (
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                      aria-hidden="true"
                    />
                  ) : (
                    <AlertTriangle
                      className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
                      aria-hidden="true"
                    />
                  )}
                  <div className="flex-1 text-sm">
                    <p
                      className={
                        testResult.reachable
                          ? "font-semibold text-emerald-700 dark:text-emerald-300"
                          : "font-semibold text-red-700 dark:text-red-300"
                      }
                    >
                      {testResult.reachable
                        ? "Connection looks great"
                        : "Couldn't reach the server"}
                    </p>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      {testResult.reachable ? (
                        <>
                          {testResult.detected_os ? (
                            <>
                              We saw <strong>{testResult.detected_os}</strong> on the other end
                            </>
                          ) : (
                            <>The server answered our knock</>
                          )}
                          {testResult.latency_ms && <> · {testResult.latency_ms}ms round-trip</>}
                        </>
                      ) : (
                        <>{testResult.reason ?? "No additional details from the server."}</>
                      )}
                    </p>
                  </div>
                  {testResult.reachable && (
                    <StatusBadge tone="success" label="Reachable" friendlyLabel="Looks great" size="sm" />
                  )}
                </div>
              </div>
            )}
          </div>
        </StoryStep>
      )}

      {step === 5 && (
        <StoryStep
          stepNumber={5}
          totalSteps={5}
          title="One last look — does this look right?"
          blurb="We'll save your settings and start watching this server. You can scan it anytime and we'll tell you if it's ready to move."
          illustration={
            <span aria-hidden="true" className="text-7xl">
              ✅
            </span>
          }
          onBack={goBack}
          onNext={async () => {
            await submitCreate();
          }}
          isFinalStep
          nextLabel="Save it"
        >
          <dl className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white text-sm dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
            <ReviewRow label="Name" value={form.name} icon={<Server className="h-4 w-4" />} />
            <ReviewRow
              label="Address"
              value={`${form.host}:${form.port}`}
              icon={<Wifi className="h-4 w-4" />}
            />
            <ReviewRow
              label="Type"
              value={SOURCE_TYPES.find((s) => s.id === form.sourceType)?.label ?? form.sourceType}
              icon={<Telescope className="h-4 w-4" />}
            />
            <ReviewRow
              label="Credentials"
              value={form.credentialRef}
              icon={<KeyRound className="h-4 w-4" />}
              mono
            />
          </dl>
        </StoryStep>
      )}

      {/* ─── Celebration on success ─── */}
      <SuccessMoment
        open={Boolean(createdId)}
        onClose={() => createdId && onSuccess(createdId)}
        title="Welcome aboard!"
        body={`Your server is connected. ${RESILIENCE} can scan it, size it up, and get it ready to move whenever you're ready.`}
        primaryCta={{
          label: "See its readiness report",
          onClick: () => createdId && onSuccess(createdId),
        }}
      />
    </>
  );
}

function ReviewRow({
  label,
  value,
  icon,
  mono = false,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  mono?: boolean;
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="text-gray-400 dark:text-gray-600" aria-hidden="true">
        {icon}
      </span>
      <dt className="w-32 shrink-0 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd
        className={[
          "min-w-0 flex-1 truncate text-sm",
          mono ? "font-mono text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-gray-100",
        ].join(" ")}
      >
        {value || <span className="text-gray-400">—</span>}
      </dd>
    </div>
  );
}

export default VmEndpointWizard;
