import { Routes, Route } from "react-router-dom";
import { LegacyHome } from "../legacy";

export function AppRouter() {
  return (
    <Routes>
      {/* Home atual preservada */}
      <Route path="/" element={<LegacyHome />} />

      {/* Rota nova para testes */}
      <Route path="/tv-mode" element={<div style={{ padding: 16 }}>TV Mode (em construção)</div>} />
    </Routes>
  );
}
