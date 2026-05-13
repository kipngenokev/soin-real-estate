import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { reportsService } from "../services/reports.service";
import { AppError } from "../utils/AppError";

function parseId(value: string, label = "id"): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new AppError(`invalid ${label}`, 400);
  return n;
}

const organization = {
  name: "Soinsync Real Estate",
};

export const reportController = {
  async paymentReceipt(req: Request, res: Response) {
    const id = parseId(req.params.id);

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        lease: {
          include: {
            tenant: { include: { user: { select: { fullName: true, email: true } } } },
            unit: { include: { property: true } },
          },
        },
      },
    });
    if (!payment) throw new AppError("payment not found", 404);

    const tenant = payment.lease?.tenant?.user
      ? {
          fullName: payment.lease.tenant.user.fullName,
          email: payment.lease.tenant.user.email,
        }
      : null;

    const file = await reportsService.pdfReceipt({
      organization,
      currency: "KES",
      payment: {
        id: payment.id,
        amount: payment.amount.toFixed(2),
        method: payment.method,
        reference: payment.reference,
        paidAt: payment.paidAt.toISOString(),
        note: payment.note,
      },
      tenant,
      lease: payment.lease ? { id: payment.lease.id } : null,
      property: payment.lease?.unit?.property
        ? {
            name: payment.lease.unit.property.name,
            location: payment.lease.unit.property.location,
          }
        : null,
      unit: payment.lease?.unit ? { label: payment.lease.unit.label } : null,
    });

    res.setHeader("Content-Type", file.contentType);
    res.setHeader("Content-Disposition", `inline; filename="${file.filename}"`);
    res.send(file.buffer);
  },
};
