import React from "react";
import { ModernCard } from "../ui";
import { AlertCircle, Info } from "lucide-react";

export interface NetworkConfigStepProps {
  targetMode: "existing" | "auto";
  hostname: string;
  ip: string;
  mask: string;
  gateway: string;
  /** Comma-separated list of DNS resolvers. */
  dns: string;
  onHostnameChange: (v: string) => void;
  onIpChange: (v: string) => void;
  onMaskChange: (v: string) => void;
  onGatewayChange: (v: string) => void;
  onDnsChange: (v: string) => void;
}

/**
 * NetworkConfigStep — collects target VM network reconfiguration that
 * AcF's `ConfigAdapterService::adapt()` consumes after data transfer
 * completes.
 *
 * **Why this step exists.** rsync copies the source's `/etc/netplan/*`
 * (or `/etc/network/interfaces` on RHEL-family) verbatim. Without an
 * `adapt_config` override, the migrated target VM boots with the
 * source's old IP/hostname baked in — networking won't come up after
 * reboot, or worse, the target tries to claim the source's IP while
 * the source is still online (collision → both go dark).
 *
 * For **auto-provisioned** targets we pre-warn the user that LeanPloy
 * will assign an IP — they should leave the IP field empty and let
 * the driver merge in the assigned address (see
 * `AnyCloudFlowDriver::createMigration` for the merge logic).
 *
 * For **existing** targets the user typically wants to leave hostname
 * blank (preserve target's hostname) and IP blank (preserve target's
 * IP) — the kernel-level NIC-renaming pass (`network_naming` flag in
 * preflight) handles the eth0→ens3 case automatically.
 *
 * Every field is optional. Empty = AcF skips that particular
 * reconfiguration step. The wizard's IP-validity check is permissive
 * (server has the authoritative `ip` rule).
 */
const NetworkConfigStep: React.FC<NetworkConfigStepProps> = ({
  targetMode,
  hostname,
  ip,
  mask,
  gateway,
  dns,
  onHostnameChange,
  onIpChange,
  onMaskChange,
  onGatewayChange,
  onDnsChange,
}) => {
  return (
    <ModernCard>
      <div className="space-y-4 p-4 sm:p-6">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Target network configuration
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Without these overrides, the migrated VM boots with the source's
            hostname and IP baked into <code>/etc/netplan</code> or{" "}
            <code>/etc/network/interfaces</code>. Networking won't come up
            after reboot — or you'll get an IP collision with the source if
            it's still online.
          </p>
        </div>

        {targetMode === "auto" ? (
          <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900 dark:border-blue-700/40 dark:bg-blue-900/20 dark:text-blue-200">
            <Info size={14} className="mt-0.5 shrink-0" />
            <span>
              For auto-provisioned targets, LeanPloy assigns the IP. Leave the{" "}
              <strong>IP</strong> field blank and we'll merge the assigned
              address in for you. Hostname is recommended so the new VM
              doesn't collide with your source on shared networks.
            </span>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-200">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>
              For existing targets you usually want to <strong>leave every
              field blank</strong> — the target already has working network
              config, and the kernel adaptation pass handles NIC renaming
              automatically. Only fill these in if you know you need to
              override something.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Hostname
              <span className="ml-1 font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={hostname}
              onChange={(e) => onHostnameChange(e.target.value)}
              placeholder="my-app-prod-2"
              autoComplete="off"
              spellCheck={false}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              We'll run <code>hostnamectl set-hostname</code> on the target.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              IP address
              <span className="ml-1 font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={ip}
              onChange={(e) => onIpChange(e.target.value)}
              placeholder={targetMode === "auto" ? "Filled by LeanPloy" : "10.0.1.42"}
              autoComplete="off"
              spellCheck={false}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              IPv4 or IPv6. Leave blank to keep what the target already has.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Netmask / prefix
              <span className="ml-1 font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={mask}
              onChange={(e) => onMaskChange(e.target.value)}
              placeholder="255.255.255.0 or 24"
              autoComplete="off"
              spellCheck={false}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              Dotted quad or CIDR prefix length. Both work.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Gateway
              <span className="ml-1 font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={gateway}
              onChange={(e) => onGatewayChange(e.target.value)}
              placeholder="10.0.1.1"
              autoComplete="off"
              spellCheck={false}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              DNS resolvers
              <span className="ml-1 font-normal text-gray-400">(optional, comma-separated)</span>
            </label>
            <input
              type="text"
              value={dns}
              onChange={(e) => onDnsChange(e.target.value)}
              placeholder="1.1.1.1, 8.8.8.8"
              autoComplete="off"
              spellCheck={false}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              We rewrite <code>/etc/resolv.conf</code> on the target after
              transfer.
            </p>
          </div>
        </div>
      </div>
    </ModernCard>
  );
};

export default NetworkConfigStep;
