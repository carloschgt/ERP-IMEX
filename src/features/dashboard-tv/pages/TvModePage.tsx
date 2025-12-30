import { useMemo } from "react";
import type { PVUnified, SLAConfig, TrafficLight } from "../../../shared/types/types-new";
import { useSLA } from "../hooks/useSLA";
import { TrafficLightCard } from "../components/TrafficLightCard";
import { loadPVUnifiedFromLocalStorage } from "../../../shared/storage/localStorageRepo";
import { loadSLAConfigFromLocalStorage } from "../../../shared/storage/slaRepo";



const fallbackConfig: SLAConfig = {
  warningWindowDays: 1,
  targetDaysByStep: {
    ESTOQUE: 2,
    COMPRAS: 3,
    FINANCEIRO: 2,
    ENGENHARIA: 7,
    DEFAULT: 30,
  },
};

const fallbackMockPVs: PVUnified[] = [
  {
    pvNumber: "1001",
    createdAtISO: new Date().toISOString(),
    currentOwnerDept: "ESTOQUE",
    steps: [{ stepKey: "ESTOQUE", status: "Pendente", updatedAtISO: new Date(Date.now() - 36e5 * 60).toISOString() }],
  },
];

const urgency: Record<TrafficLight, number> = { RED: 0, YELLOW: 1, GREEN: 2 };

export function TvModePage() {
  const config = useMemo<SLAConfig>(() => {
    const fromLS = loadSLAConfigFromLocalStorage();
    return {
      warningWindowDays: fromLS?.warningWindowDays ?? fallbackConfig.warningWindowDays,
      targetDaysByStep: fromLS?.targetDaysByStep ?? fallbackConfig.targetDaysByStep,
    };
  }, []);

  const pvs = useMemo(() => {
    const fromLS = loadPVUnifiedFromLocalStorage();
    return fromLS.length > 0 ? fromLS : fallbackMockPVs;
  }, []);

  const enriched = useMemo(() => {
    return pvs.map((pv) => ({ pv }));
  }, [pvs]);

  return (
    <main style={{ background: "#000", minHeight: "100vh", padding: 16 }}>
      <h1 style={{ color: "#fff", fontSize: 18, marginBottom: 12 }}>Painel TV - Pendências</h1>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
        {enriched
          .map(({ pv }) => {
            const { light } = useSLA(pv, config);
            return { pv, light };
          })
          .sort((a, b) => urgency[a.light] - urgency[b.light])
          .map(({ pv, light }) => (
            <TrafficLightCard key={pv.pvNumber} pv={pv} light={light} subtitle={pv.currentOwnerDept} />
          ))}
      </section>
    </main>
  );
}
