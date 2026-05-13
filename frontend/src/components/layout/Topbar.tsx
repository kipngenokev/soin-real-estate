export function Topbar() {
  return (
    <header className="h-14 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="text-sm font-medium text-gray-700">Dashboard</div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">Welcome</span>
        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
          U
        </div>
      </div>
    </header>
  );
}
