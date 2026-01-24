import React from "react";
import KeyPairsSection from "../../../shared/components/infrastructure/KeyPairsSection";

interface KeyPairsProps {
  projectId?: string;
  region?: string;
  onStatsUpdate?: (count: number) => void;
}

const KeyPairs: React.FC<KeyPairsProps> = (props) => <KeyPairsSection {...props} />;

export default KeyPairs;
