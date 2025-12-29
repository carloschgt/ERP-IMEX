import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "./router";

export function AppShell() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}
