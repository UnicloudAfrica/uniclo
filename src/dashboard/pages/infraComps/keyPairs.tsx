import React from "react";
import KeyPairsContainer, {
  type KeyPairHooks,
} from "@/shared/components/infrastructure/containers/KeyPairsContainer";
import { useFetchKeyPairs, useDeleteKeyPair, useSyncKeyPairs } from "@/shared/hooks/keyPairsHooks";

interface KeyPairsProps {
  projectId?: string;
  region?: string;
  onStatsUpdate?: (count: number) => void;
}

const hooks: KeyPairHooks = {
  useList: useFetchKeyPairs as KeyPairHooks["useList"],
  useDelete: useDeleteKeyPair as KeyPairHooks["useDelete"],
  useSync: useSyncKeyPairs as KeyPairHooks["useSync"],
};

const KeyPairs: React.FC<KeyPairsProps> = ({ projectId = "", region = "", onStatsUpdate }) => (
  <KeyPairsContainer
    hierarchy="tenant"
    projectId={projectId}
    region={region}
    hooks={hooks}
    onStatsUpdate={onStatsUpdate}
    wrapper={({ children }) => <>{children}</>}
  />
);

export default KeyPairs;
