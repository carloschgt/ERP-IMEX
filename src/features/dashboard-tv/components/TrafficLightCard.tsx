import type { PVUnified, TrafficLight } from "../../../shared/types/types-new";

export function TrafficLightCard(props: {
  pv: PVUnified;
  light: TrafficLight;
  subtitle?: string;
}) {
  const { pv, light, subtitle } = props;

  const ui = getTrafficLightUI(light);

  return (
    <article
      style={{
        background: "#0b0b0b",
        borderRadius: 14,
        padding: 14,
        border: `2px solid ${ui.border}`,
        boxShadow: "0 0 0 1px rgba(255,255,255,0.03) inset",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        minHeight: 74,
      }}
    >
      {/* Lado esquerdo */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* bolinha do semáforo */}
          <span
            aria-label={`Semáforo ${ui.label}`}
            title={`Semáforo: ${ui.label}`}
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: ui.dot,
              boxShadow: `0 0 12px ${ui.dot}`,
              flex: "0 0 auto",
            }}
          />
          <div style={{ color: "#fff", fontWeight: 800, letterSpacing: 0.2, whiteSpace: "nowrap" }}>
            PV {pv.pvNumber || "—"}
          </div>
        </div>

        <div
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: 12,
            marginTop: 6,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {(subtitle || pv.currentOwnerDept || "DEFAULT").toString()}
        </div>
      </div>

      {/* Lado direito */}
      <div style={{ textAlign: "right", flex: "0 0 auto" }}>
        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>Semáforo</div>

        <div
          style={{
            marginTop: 6,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            borderRadius: 999,
            background: ui.badgeBg,
            color: ui.badgeText,
            fontWeight: 800,
            fontSize: 12,
            border: `1px solid ${ui.badgeBorder}`,
          }}
        >
          {ui.label}
        </div>
      </div>
    </article>
  );
}

function getTrafficLightUI(light: TrafficLight) {
  if (light === "RED") {
    return {
      label: "Atrasado",
      dot: "#ef4444",
      border: "rgba(239,68,68,0.7)",
      badgeBg: "rgba(239,68,68,0.15)",
      badgeBorder: "rgba(239,68,68,0.45)",
      badgeText: "#fecaca",
    };
  }

  if (light === "YELLOW") {
    return {
      label: "Atenção",
      dot: "#f59e0b",
      border: "rgba(245,158,11,0.7)",
      badgeBg: "rgba(245,158,11,0.15)",
      badgeBorder: "rgba(245,158,11,0.45)",
      badgeText: "#fde68a",
    };
  }

  // GREEN
  return {
    label: "No prazo",
    dot: "#22c55e",
    border: "rgba(34,197,94,0.7)",
    badgeBg: "rgba(34,197,94,0.15)",
    badgeBorder: "rgba(34,197,94,0.45)",
    badgeText: "#bbf7d0",
  };
}
