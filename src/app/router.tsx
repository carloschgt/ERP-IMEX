import { Routes, Route } from "react-router-dom";
import { LegacyHome } from "../legacy";
import { TvModePage } from "../features/dashboard-tv/pages/TvModePage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LegacyHome />} />
      <Route path="/tv-mode" element={<TvModePage />} />
    </Routes>
  );
}
