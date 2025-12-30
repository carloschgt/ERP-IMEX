import { useMemo } from "react";
import type { PVUnified, SLAConfig } from "../../../shared/types/types-new";
import { computeTrafficLight } from "../utils/slaCalculator";

export function useSLA(pv: PVUnified, config: SLAConfig) {
  return useMemo(() => {
    const now = new Date();

    const currentStep =
      [...pv.steps].reverse().find((s) => s.status === "Pendente") ??
      pv.steps[pv.steps.length - 1];

    const slaDays = config.targetDaysByStep[currentStep?.stepKey ?? "DEFAULT"] ?? 30;
    const slaHours = slaDays * 24;

    const res = computeTrafficLight({
      now,
      step: currentStep,
      slaHours,
      warningWindowDays: config.warningWindowDays,
    });

    return { currentStep, ...res };
  }, [pv, config]);
}
