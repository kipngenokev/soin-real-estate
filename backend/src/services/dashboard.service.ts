import { IssueStatus, LeaseStatus, Prisma, UnitStatus } from "@prisma/client";
import { prisma } from "../config/prisma";

export type DashboardStats = {
  properties: number;
  units: { total: number; occupied: number; available: number };
  occupancyRate: number; // 0..100, one decimal
  activeLeases: number;
  payments: { count: number; totalAmount: string };
  openIssues: number;
};

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const [
      properties,
      unitsTotal,
      unitsOccupied,
      activeLeases,
      paymentAgg,
      openIssues,
    ] = await Promise.all([
      prisma.property.count(),
      prisma.unit.count(),
      prisma.unit.count({ where: { status: UnitStatus.OCCUPIED } }),
      prisma.lease.count({ where: { status: LeaseStatus.ACTIVE } }),
      prisma.payment.aggregate({ _sum: { amount: true }, _count: { _all: true } }),
      prisma.issue.count({ where: { status: IssueStatus.OPEN } }),
    ]);

    const available = unitsTotal - unitsOccupied;
    const occupancyRate =
      unitsTotal === 0 ? 0 : Math.round((unitsOccupied / unitsTotal) * 1000) / 10;
    const totalAmount = (paymentAgg._sum.amount ?? new Prisma.Decimal(0)).toFixed(2);

    return {
      properties,
      units: { total: unitsTotal, occupied: unitsOccupied, available },
      occupancyRate,
      activeLeases,
      payments: { count: paymentAgg._count._all, totalAmount },
      openIssues,
    };
  },
};
