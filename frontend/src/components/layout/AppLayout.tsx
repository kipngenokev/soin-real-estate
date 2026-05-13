import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-subtle">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-6xl px-6 lg:px-10 py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
