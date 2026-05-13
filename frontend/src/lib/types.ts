export type ApiEnvelope<T> = { success: boolean; message: string; data: T };

export type UnitType = "STUDIO" | "ONE_BEDROOM";
export type UnitStatus = "AVAILABLE" | "OCCUPIED";

export type Property = {
  id: number;
  name: string;
  location: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { units: number };
};

export type Unit = {
  id: number;
  propertyId: number;
  label: string;
  type: UnitType;
  rentAmount: string; // Decimal serialized as string by Prisma JSON
  status: UnitStatus;
  createdAt: string;
  updatedAt: string;
};

export type TenantUser = {
  id: number;
  email: string;
  fullName: string;
  role: "ADMIN" | "TENANT";
  isActive: boolean;
  createdAt: string;
};

export type LeaseStatus = "DRAFT" | "ACTIVE" | "ENDED";

export type LeaseWithUnit = {
  id: number;
  tenantId: number;
  unitId: number;
  status: LeaseStatus;
  startDate: string | null;
  endDate: string | null;
  monthlyRent: string;
  createdAt: string;
  updatedAt: string;
  unit?: Unit & { property?: Property };
};

export type LeaseDetail = LeaseWithUnit & {
  tenant?: {
    id: number;
    user: { id: number; email: string; fullName: string };
  };
};

export type UnitWithProperty = Unit & { property?: Property };

export type Tenant = {
  id: number;
  userId: number;
  phone: string | null;
  nationalId: string | null;
  emergencyContact: string | null;
  createdAt: string;
  updatedAt: string;
  user: TenantUser;
  leases: LeaseWithUnit[]; // active lease only (length 0 or 1) from backend
};
