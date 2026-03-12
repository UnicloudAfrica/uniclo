import React from "react";
import { Configuration, Option } from "@/types/InstanceConfiguration";
import { ModernButton, SearchableSelect } from "../ui";

interface AccessKeysSectionProps {
  cfg: Configuration;
  isNewProject: boolean;
  hasRegion: boolean;
  canManageKeypairs: boolean;
  canSelectExistingKeypairs: boolean;
  resolvedKeyPairOptions: Option[];
  keypairMode: "existing" | "create";
  keypairModeName: string;
  keypairNameInput: string;
  keypairPublicKey: string;
  keypairMaterial: string | null;
  isCreatingKeypair: boolean;
  hasDownloadedKeypair: boolean;
  focusKey: (field: string) => string;
  updateConfigWithFocus: (patch: Partial<Configuration>) => void;
  preserveInputState: (action: () => void) => void;
  setKeypairMode: (mode: "existing" | "create") => void;
  setKeypairNameInput: (value: string) => void;
  setKeypairPublicKey: (value: string) => void;
  setKeypairMaterial: (value: string | null) => void;
  setHasDownloadedKeypair: (value: boolean) => void;
  handleCreateKeypair: () => void;
  downloadPrivateKey: (material: string, name: string) => void;
}

const AccessKeysSection: React.FC<AccessKeysSectionProps> = ({
  cfg,
  isNewProject,
  hasRegion,
  canManageKeypairs,
  canSelectExistingKeypairs,
  resolvedKeyPairOptions,
  keypairMode,
  keypairModeName,
  keypairNameInput,
  keypairPublicKey,
  keypairMaterial,
  isCreatingKeypair,
  hasDownloadedKeypair,
  focusKey,
  updateConfigWithFocus,
  preserveInputState,
  setKeypairMode,
  setKeypairNameInput,
  setKeypairPublicKey,
  setKeypairMaterial,
  setHasDownloadedKeypair,
  handleCreateKeypair,
  downloadPrivateKey,
}) => {
  if (isNewProject) {
    if (!hasRegion) {
      return (
        <p className="text-xs text-gray-500">
          Select a region to configure an SSH key pair for this new project.
        </p>
      );
    }

    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
          Keypair will be created when the project is provisioned.
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Key pair name (optional)
            </label>
            <input
              type="text"
              data-focus-key={focusKey("keypair_name")}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              value={cfg.keypair_name || ""}
              onChange={(e) => updateConfigWithFocus({ keypair_name: e.target.value })}
              placeholder="e.g. cube-instance-key"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Public key (optional)
            </label>
            <input
              type="text"
              data-focus-key={focusKey("keypair_public_key")}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              value={cfg.keypair_public_key || ""}
              onChange={(e) => updateConfigWithFocus({ keypair_public_key: e.target.value })}
              placeholder="ssh-rsa AAAA..."
            />
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Leave blank to skip keypair creation. You can add keys later in the project.
        </p>
      </div>
    );
  }

  if (!canManageKeypairs) {
    return (
      <p className="text-xs text-gray-500">
        Key pairs require an existing project. Select a project to manage SSH keys.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
          <input
            type="radio"
            name={keypairModeName}
            value="existing"
            checked={keypairMode === "existing"}
            onChange={() => {
              preserveInputState(() => {
                setKeypairMode("existing");
                setKeypairMaterial(null);
                setHasDownloadedKeypair(false);
              });
            }}
          />
          Use existing key pair
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
          <input
            type="radio"
            name={keypairModeName}
            value="create"
            checked={keypairMode === "create"}
            onChange={() => {
              preserveInputState(() => {
                setKeypairMode("create");
                setKeypairMaterial(null);
                setHasDownloadedKeypair(false);
              });
            }}
          />
          Create new key pair
        </label>
      </div>

      {keypairMode === "existing" ? (
        <SearchableSelect
          label="Key pair"
          value={cfg.keypair_name}
          onChange={(e) => {
            const selectedLabel = e.target.selectedOptions?.[0]?.text || "";
            updateConfigWithFocus({
              keypair_name: e.target.value,
              keypair_label: e.target.value ? selectedLabel : "",
            });
          }}
          options={[{ value: "", label: "Select key pair (optional)" }, ...resolvedKeyPairOptions]}
          helper="Select SSH key pair to authorize access."
          disabled={!canSelectExistingKeypairs}
        />
      ) : (
        <CreateKeypairForm
          keypairNameInput={keypairNameInput}
          keypairPublicKey={keypairPublicKey}
          keypairMaterial={keypairMaterial}
          isCreatingKeypair={isCreatingKeypair}
          hasDownloadedKeypair={hasDownloadedKeypair}
          focusKey={focusKey}
          setKeypairNameInput={setKeypairNameInput}
          setKeypairPublicKey={setKeypairPublicKey}
          handleCreateKeypair={handleCreateKeypair}
          downloadPrivateKey={downloadPrivateKey}
        />
      )}
    </div>
  );
};

/* ---------- Create keypair form ---------- */

interface CreateKeypairFormProps {
  keypairNameInput: string;
  keypairPublicKey: string;
  keypairMaterial: string | null;
  isCreatingKeypair: boolean;
  hasDownloadedKeypair: boolean;
  focusKey: (field: string) => string;
  setKeypairNameInput: (value: string) => void;
  setKeypairPublicKey: (value: string) => void;
  handleCreateKeypair: () => void;
  downloadPrivateKey: (material: string, name: string) => void;
}

const CreateKeypairForm: React.FC<CreateKeypairFormProps> = ({
  keypairNameInput,
  keypairPublicKey,
  keypairMaterial,
  isCreatingKeypair,
  hasDownloadedKeypair,
  focusKey,
  setKeypairNameInput,
  setKeypairPublicKey,
  handleCreateKeypair,
  downloadPrivateKey,
}) => (
  <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
    <div className="grid gap-3 md:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Key pair name *</label>
        <input
          type="text"
          data-focus-key={focusKey("keypair_name_create")}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          value={keypairNameInput}
          onChange={(e) => setKeypairNameInput(e.target.value)}
          placeholder="e.g. cube-instance-key"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Public key (optional)
        </label>
        <input
          type="text"
          data-focus-key={focusKey("keypair_public_create")}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          value={keypairPublicKey}
          onChange={(e) => setKeypairPublicKey(e.target.value)}
          placeholder="ssh-rsa AAAA..."
        />
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <ModernButton
        variant="outline"
        size="sm"
        onClick={handleCreateKeypair}
        isDisabled={isCreatingKeypair || !keypairNameInput.trim()}
      >
        {isCreatingKeypair ? "Creating..." : "Create key pair"}
      </ModernButton>
      {keypairMaterial && (
        <ModernButton
          variant="ghost"
          size="sm"
          onClick={() => downloadPrivateKey(keypairMaterial, keypairNameInput || "keypair")}
          isDisabled={hasDownloadedKeypair}
        >
          {hasDownloadedKeypair ? "Downloaded" : "Download private key"}
        </ModernButton>
      )}
      {keypairMaterial && !hasDownloadedKeypair && (
        <span className="text-xs text-amber-700">
          Download the private key once and store it securely.
        </span>
      )}
      {keypairMaterial && hasDownloadedKeypair && (
        <span className="text-xs text-gray-500">Key pair is selected for this instance.</span>
      )}
    </div>
  </div>
);

export default AccessKeysSection;
