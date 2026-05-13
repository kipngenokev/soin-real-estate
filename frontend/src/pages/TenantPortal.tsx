import { useAuth } from "../context/AuthContext";
import { PageHeader } from "../components/ui/PageHeader";
import { StatTile } from "../components/ui/StatTile";

export function TenantPortal() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Portal"
        title={`Welcome, ${user?.fullName ?? "tenant"}.`}
        subtitle="View your lease, payments and submit maintenance requests."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatTile tone="emerald" label="Current balance" value="—" />
        <StatTile tone="blue" label="Next due date" value="—" />
        <StatTile tone="amber" label="Open requests" value="—" />
      </div>
    </div>
  );
}
