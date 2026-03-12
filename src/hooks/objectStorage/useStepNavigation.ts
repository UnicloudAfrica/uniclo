import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { BASE_STEPS_FAST_TRACK, BASE_STEPS_STANDARD } from "./constants";

export interface UseStepNavigationOptions {
  allowFastTrack: boolean;
}

export interface UseStepNavigationReturn {
  mode: string;
  isFastTrack: boolean;
  activeStep: number;
  setActiveStep: React.Dispatch<React.SetStateAction<number>>;
  steps: { id: string; label: string; description: string }[];
  isFirstStep: boolean;
  isLastStep: boolean;
  canFastTrack: boolean;
  handleModeChange: (nextMode: string, onReset: () => void) => void;
  goToStep: (stepIndex: number) => void;
}

export const useStepNavigation = (options: UseStepNavigationOptions): UseStepNavigationReturn => {
  const { allowFastTrack } = options;
  const [searchParams, setSearchParams] = useSearchParams();

  const canFastTrack = allowFastTrack !== false;
  const initialMode =
    searchParams.get("mode") === "fast-track" && canFastTrack ? "fast-track" : "standard";
  const [mode, setMode] = useState(initialMode);
  const isFastTrack = canFastTrack && mode === "fast-track";
  const [activeStep, setActiveStep] = useState(0);

  const steps = useMemo(
    () => (isFastTrack ? BASE_STEPS_FAST_TRACK : BASE_STEPS_STANDARD),
    [isFastTrack]
  );

  useEffect(() => {
    setActiveStep((prev) => Math.min(prev, steps.length - 1));
  }, [steps.length]);

  useEffect(() => {
    if (canFastTrack || mode !== "fast-track") return;
    setMode("standard");
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.delete("mode");
      return params;
    });
  }, [canFastTrack, mode, setSearchParams]);

  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === steps.length - 1;

  const handleModeChange = useCallback(
    (nextMode: string, onReset: () => void) => {
      if (!canFastTrack && nextMode === "fast-track") return;
      if (nextMode === mode) return;
      onReset();
      setMode(nextMode);
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (nextMode === "fast-track") {
          params.set("mode", "fast-track");
        } else {
          params.delete("mode");
        }
        return params;
      });
    },
    [mode, canFastTrack, setSearchParams]
  );

  const goToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= 0 && stepIndex < steps.length) {
        setActiveStep(stepIndex);
      }
    },
    [steps.length]
  );

  return {
    mode,
    isFastTrack,
    activeStep,
    setActiveStep,
    steps,
    isFirstStep,
    isLastStep,
    canFastTrack,
    handleModeChange,
    goToStep,
  };
};
