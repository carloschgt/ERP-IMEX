import { describe, it, expect } from "vitest";
import { computeTrafficLight } from "../utils/slaCalculator";

describe("computeTrafficLight", () => {
  it("fica RED quando passou do SLA", () => {
    const res = computeTrafficLight({
      now: new Date("2025-01-10T12:00:00.000Z"),
      step: { stepKey: "ESTOQUE", status: "Pendente", updatedAtISO: "2025-01-01T12:00:00.000Z" },
      slaHours: 24,
      warningWindowDays: 15,
    });
    expect(res.light).toBe("RED");
  });

  it("fica GREEN quando está fora da janela de alerta", () => {
  const res = computeTrafficLight({
    now: new Date("2025-01-02T12:00:00.000Z"),
    step: { stepKey: "ESTOQUE", status: "Pendente", updatedAtISO: "2025-01-01T12:00:00.000Z" },
    slaHours: 40 * 24,        // 40 dias de SLA
    warningWindowDays: 15,    // janela de alerta 15 dias
  });
  expect(res.light).toBe("GREEN");
});
});
