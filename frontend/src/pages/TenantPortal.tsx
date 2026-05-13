import { useAuth } from "../context/AuthContext";

export function TenantPortal() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Tenant Portal</h2>
        <p className="text-sm text-gray-500 mt-1">
          Welcome, {user?.fullName}. View your lease, payments and submit maintenance requests.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Current Balance", value: "—" },
          { label: "Next Due Date", value: "—" },
          { label: "Open Requests", value: "—" },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
          >
            <div className="text-xs uppercase tracking-wide text-gray-500">{card.label}</div>
            <div className="text-2xl font-semibold text-gray-900 mt-2">{card.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
