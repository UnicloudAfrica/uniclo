import type { MailImapConfig } from "@/shared/hooks/resources";

/**
 * Friendly IMAP presets for the "Other email" path of the Move My Email wizard.
 *
 * Most people have no idea what their IMAP host/port is, and many providers
 * require an *App Password* (a special one-time password you generate, NOT your
 * normal login password) when 2-factor sign-in is turned on. These presets let
 * us auto-fill the technical bits and show plain-English steps for getting the
 * right password.
 *
 * NOTE: Provider help URLs and exact steps drift over time — they should be
 * double-checked against each provider's current documentation periodically.
 */

export type MailProviderPresetId =
  | "gmail"
  | "outlook"
  | "yahoo"
  | "zoho"
  | "icloud"
  | "other";

export interface MailProviderPreset {
  id: MailProviderPresetId;
  /** Human label shown on the picker card. */
  label: string;
  /** Friendly emoji shown on the card. */
  emoji: string;
  /** IMAP server, or null for "Other" (user types their own). */
  host: string | null;
  /** IMAP port, or null for "Other". */
  port: number | null;
  /** Encryption to auto-fill, or null for "Other". */
  encryption: MailImapConfig["encryption"] | null;
  /**
   * Numbered, plain-language steps for getting the password this provider
   * needs (usually an App Password). Empty for "Other".
   */
  appPasswordSteps: string[];
  /** Official help-page URL, or null for "Other". */
  helpUrl: string | null;
  /** Label for the help link. */
  helpLabel: string;
}

export const MAIL_PROVIDER_PRESETS: MailProviderPreset[] = [
  {
    id: "gmail",
    label: "Gmail",
    emoji: "📧",
    host: "imap.gmail.com",
    port: 993,
    encryption: "ssl",
    appPasswordSteps: [
      "Turn on 2-Step Verification for your Google account (App Passwords need it first).",
      "Open your Google Account → Security → App passwords.",
      "Create a new app password and name it something like “UniCloud”.",
      "Copy the 16-character password Google shows you.",
      "Paste it into the Password box here — not your normal Gmail password.",
    ],
    helpUrl: "https://support.google.com/mail/answer/185833",
    helpLabel: "Google: create an App Password",
  },
  {
    id: "outlook",
    label: "Outlook / Hotmail",
    emoji: "📨",
    host: "outlook.office365.com",
    port: 993,
    encryption: "ssl",
    appPasswordSteps: [
      "Sign in at account.microsoft.com → Security.",
      "Open “Advanced security options”.",
      "If two-step verification is on, choose “Create a new app password”.",
      "Copy the app password Microsoft shows you.",
      "Paste it into the Password box here — not your normal Microsoft password.",
    ],
    helpUrl: "https://support.microsoft.com/en-us/account-billing/using-app-passwords-with-apps-that-don-t-support-two-step-verification-5896ed9b-4263-e681-128a-a6f2979a7944",
    helpLabel: "Microsoft: using App Passwords",
  },
  {
    id: "yahoo",
    label: "Yahoo Mail",
    emoji: "💌",
    host: "imap.mail.yahoo.com",
    port: 993,
    encryption: "ssl",
    appPasswordSteps: [
      "Sign in to Yahoo and open your Account Security page.",
      "Under “External connections”, choose “App passwords”.",
      "Click “Generate app password”, enter the name “UniCloud”, and generate it.",
      "Copy the password Yahoo generates.",
      "Paste it into the Password box here — not your normal Yahoo password.",
    ],
    helpUrl: "https://help.yahoo.com/kb/SLN15241.html",
    helpLabel: "Yahoo: generate an App Password",
  },
  {
    id: "zoho",
    label: "Zoho Mail",
    emoji: "✉️",
    host: "imap.zoho.com",
    port: 993,
    encryption: "ssl",
    appPasswordSteps: [
      "Sign in to Zoho Mail → Settings → Mail Accounts and turn IMAP Access ON.",
      "Go to accounts.zoho.com → Security → App Passwords.",
      "Click “Generate New Password” and name it “UniCloud”.",
      "Copy the app password Zoho shows you.",
      "Paste it into the Password box here — not your normal Zoho password.",
    ],
    helpUrl: "https://www.zoho.com/mail/help/imap-access.html",
    helpLabel: "Zoho: enable IMAP & App Passwords",
  },
  {
    id: "icloud",
    label: "iCloud Mail",
    emoji: "🍎",
    host: "imap.mail.me.com",
    port: 993,
    encryption: "ssl",
    appPasswordSteps: [
      "Sign in at account.apple.com (you'll need two-factor authentication on).",
      "In the Sign-In and Security section, choose “App-Specific Passwords”.",
      "Click the + (or “Generate password”) and name it “UniCloud”.",
      "Copy the app-specific password Apple shows you.",
      "Paste it into the Password box here — not your normal Apple password.",
    ],
    helpUrl: "https://support.apple.com/en-us/102654",
    helpLabel: "Apple: create an App-Specific Password",
  },
  {
    id: "other",
    label: "Other / my own server",
    emoji: "📮",
    host: null,
    port: null,
    encryption: null,
    appPasswordSteps: [],
    helpUrl: null,
    helpLabel: "",
  },
];

export function getMailProviderPreset(
  id: MailProviderPresetId
): MailProviderPreset | undefined {
  return MAIL_PROVIDER_PRESETS.find((p) => p.id === id);
}
