import React from "react";
import KeyPairsContainer, {
  type KeyPairHooks,
} from "@/shared/components/infrastructure/containers/KeyPairsContainer";
import {
  useFetchClientKeyPairs,
  useDeleteClientKeyPair,
  useSyncKeyPairs,
} from "@/shared/hooks/keyPairsHooks";

interface KeyPairsProps {
  projectId?: string;
  region?: string;
  onStatsUpdate?: (count: number) => void;
}

const hooks: KeyPairHooks = {
  useList: useFetchClientKeyPairs as KeyPairHooks["useList"],
  useDelete: useDeleteClientKeyPair as KeyPairHooks["useDelete"],
  useSync: useSyncKeyPairs as KeyPairHooks["useSync"],
};

const KeyPairs: React.FC<KeyPairsProps> = ({ projectId = "", region = "", onStatsUpdate }) => (
  <KeyPairsContainer
    hierarchy="client"
    projectId={projectId}
    region={region}
    hooks={hooks}
    onStatsUpdate={onStatsUpdate}
    wrapper={({ children }) => <>{children}</>}
  />
);

export default KeyPairs;
