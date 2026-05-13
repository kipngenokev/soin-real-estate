export function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">
          Foundation scaffold is running. Feature modules will land here in upcoming phases.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Properties", value: "—" },
          { label: "Active Tenants", value: "—" },
          { label: "Rent Collected (MTD)", value: "—" },
          { label: "Open Issues", value: "—" },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
          >
            <div className="text-xs uppercase tracking-wide text-gray-500">
              {card.label}
            </div>
            <div className="text-2xl font-semibold text-gray-900 mt-2">
              {card.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
