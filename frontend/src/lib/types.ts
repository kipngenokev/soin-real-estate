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
