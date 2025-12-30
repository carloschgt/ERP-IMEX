import type { SLAResult, TrafficLight, PVStepAudit } from "../../../shared/types/types-new";

function hoursBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60);
}

export function computeTrafficLight(params: {
  now: Date;
  step: PVStepAudit;
  slaHours: number;
  warningWindowDays: number;
}): SLAResult {
  const updatedAt = new Date(params.step.updatedAtISO);
  const agingHours = Math.max(0, hoursBetween(updatedAt, params.now));
  const remainingHours = Math.max(0, params.slaHours - agingHours);

  const warningHours = params.warningWindowDays * 24;

  let light: TrafficLight = "GREEN";
  if (remainingHours <= 0) light = "RED";
  else if (remainingHours <= warningHours) light = "YELLOW";

  return { light, agingHours, remainingHours };
}
