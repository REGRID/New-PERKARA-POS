import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const db = prisma as any;

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");
    const employeeParam = searchParams.get("employee");

    const month = monthParam ? parseInt(monthParam, 10) : new Date().getMonth() + 1;
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    // 1. Fetch Real Employees from Database
    const empModel = db.employee || db.Employee;
    let employees: any[] = [];
    if (empModel) {
      employees = await empModel.findMany({
        orderBy: { name: "asc" },
      });
    }

    // 2. Fetch Real ShiftLogs from Database for selected month and year
    const shiftModel = db.shiftLog || db.shiftlog || db.ShiftLog;
    let calendarLogs: any[] = [];

    if (shiftModel) {
      const startDate = new Date(year, month - 1, 1, 0, 0, 0);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const whereClause: any = {
        OR: [
          {
            timestamp: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            startTime: {
              gte: startDate,
              lte: endDate,
            },
          },
        ],
      };

      if (employeeParam && employeeParam !== "ALL") {
        whereClause.employeeName = employeeParam;
      }

      const rawLogs = await shiftModel.findMany({
        where: whereClause,
        orderBy: { startTime: "desc" },
        include: { employee: true },
      });

      calendarLogs = rawLogs.map((l: any) => ({
        id: l.id,
        employeeId: l.employeeId,
        employeeName: l.employeeName || l.employee?.name || "Karyawan",
        type: l.type || (l.status === "CLOSED" ? "SHIFT_OUT" : "SHIFT_IN"),
        shiftCategory: l.shiftCategory || "FULL_TIME",
        timestamp: (l.timestamp || l.startTime || new Date()).toISOString(),
        startingCash: Number(l.startingCash || l.startCash || 0),
        cashVerified: Number(l.cashVerified || l.endCash || 0),
        cashExpected: Number(l.cashExpected || l.expectedCash || 0),
        cashDiscrepancy: Number(l.cashDiscrepancy || l.difference || 0),
        cashNote: l.cashNote || (l.status === "CLOSED" ? "Closing shift" : "Buka shift"),
        stockReport: l.stockReport || null,
        status: l.status || "OPEN",
      }));
    }

    // 3. Active Shifts
    const employeeActiveMap = new Map<string, any>();
    const sortedLogs = [...calendarLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    for (const log of sortedLogs) {
      if (!employeeActiveMap.has(log.employeeName)) {
        if (log.type === "SHIFT_IN" || log.status === "OPEN") {
          employeeActiveMap.set(log.employeeName, log);
        } else {
          employeeActiveMap.set(log.employeeName, null);
        }
      }
    }
    const activeShifts = Array.from(employeeActiveMap.values()).filter((shift) => shift !== null);

    return NextResponse.json({
      success: true,
      employees,
      calendarLogs,
      activeShifts,
      recentLogs: sortedLogs.slice(0, 50),
    });
  } catch (err: any) {
    console.error("GET /api/absen-kas error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, employeeName, shiftCategory, startingCash, cashVerified, note, type, timestamp } = body;

    const shiftModel = db.shiftLog || db.shiftlog || db.ShiftLog;
    const empModel = db.employee || db.Employee;

    // Resolve employee
    let empRecord = null;
    if (empModel && employeeName) {
      try {
        empRecord = await empModel.findFirst({ where: { name: employeeName } });
      } catch {}
    }

    const logDate = timestamp ? new Date(timestamp) : new Date();

    if (action === "shift-in" || type === "SHIFT_IN") {
      const startAmount = Number(startingCash) || 0;
      const newLog = {
        employeeId: empRecord?.id || null,
        employeeName: employeeName,
        shiftCategory: shiftCategory || "FULL_TIME",
        type: "SHIFT_IN",
        startTime: logDate,
        timestamp: logDate,
        startingCash: startAmount,
        startCash: startAmount,
        cashNote: note || "Absen masuk shift",
        status: "OPEN",
      };

      const created = shiftModel ? await shiftModel.create({ data: newLog }) : newLog;
      return NextResponse.json({ success: true, message: `Absen masuk berhasil: ${employeeName}`, log: created });
    }

    if (action === "shift-out" || type === "SHIFT_OUT") {
      const verified = Number(cashVerified) || 0;
      const startAmount = Number(startingCash) || 0;
      const discrepancy = verified - startAmount;

      const reportText = `=== LAPORAN CLOSING SHIFT PERKARA KOPI ===\nNama Kasir: ${employeeName}\nTanggal: ${logDate.toLocaleString("id-ID")}\nModal Awal: Rp ${startAmount.toLocaleString("id-ID")}\nKas Fisik Laci: Rp ${verified.toLocaleString("id-ID")}\nSelisih Kas: Rp ${discrepancy.toLocaleString("id-ID")}\nCatatan: ${note || "-"}`;

      const newLog = {
        employeeId: empRecord?.id || null,
        employeeName: employeeName,
        shiftCategory: shiftCategory || "FULL_TIME",
        type: "SHIFT_OUT",
        startTime: logDate,
        endTime: logDate,
        timestamp: logDate,
        cashVerified: verified,
        endCash: verified,
        cashExpected: startAmount,
        expectedCash: startAmount,
        cashDiscrepancy: discrepancy,
        difference: discrepancy,
        cashNote: note || (discrepancy === 0 ? "Kas PAS" : discrepancy > 0 ? "Kas LEBIH" : "Kas KURANG"),
        stockReport: reportText,
        status: "CLOSED",
      };

      const created = shiftModel ? await shiftModel.create({ data: newLog }) : newLog;
      return NextResponse.json({
        success: true,
        message: `Closing shift berhasil: ${employeeName}`,
        stockReportText: reportText,
        log: created,
      });
    }

    if (action === "admin-create-shift") {
      const startAmount = Number(startingCash) || 0;
      const verifiedAmount = Number(cashVerified) || 0;
      const isOut = type === "SHIFT_OUT";
      const discrepancy = isOut ? verifiedAmount - startAmount : 0;

      const newLog = {
        employeeId: empRecord?.id || null,
        employeeName: employeeName,
        shiftCategory: shiftCategory || "FULL_TIME",
        type: type || "SHIFT_IN",
        startTime: logDate,
        endTime: isOut ? logDate : null,
        timestamp: logDate,
        startingCash: startAmount,
        startCash: startAmount,
        cashVerified: verifiedAmount,
        endCash: verifiedAmount,
        cashExpected: startAmount,
        expectedCash: startAmount,
        cashDiscrepancy: discrepancy,
        difference: discrepancy,
        cashNote: note || "Manual log oleh admin",
        status: isOut ? "CLOSED" : "OPEN",
      };

      const created = shiftModel ? await shiftModel.create({ data: newLog }) : newLog;
      return NextResponse.json({ success: true, message: `Log shift admin berhasil ditambahkan`, log: created });
    }

    return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
  } catch (err: any) {
    console.error("POST /api/absen-kas error:", err);
    return NextResponse.json({ error: err.message || "Failed to process request" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, employeeName, type, timestamp, startingCash, cashVerified, cashDiscrepancy, cashNote } = body;

    const shiftModel = db.shiftLog || db.shiftlog || db.ShiftLog;
    if (shiftModel && id) {
      await shiftModel.update({
        where: { id },
        data: {
          employeeName,
          type,
          timestamp: timestamp ? new Date(timestamp) : undefined,
          startTime: timestamp ? new Date(timestamp) : undefined,
          startingCash: Number(startingCash) || 0,
          startCash: Number(startingCash) || 0,
          cashVerified: Number(cashVerified) || 0,
          endCash: Number(cashVerified) || 0,
          cashDiscrepancy: Number(cashDiscrepancy) || 0,
          difference: Number(cashDiscrepancy) || 0,
          cashNote: cashNote || "",
          status: type === "SHIFT_OUT" ? "CLOSED" : "OPEN",
        },
      });
    }

    return NextResponse.json({ success: true, message: "Log absen berhasil diperbarui" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const shiftModel = db.shiftLog || db.shiftlog || db.ShiftLog;
    if (shiftModel) {
      await shiftModel.delete({ where: { id } });
    }

    return NextResponse.json({ success: true, message: "Log absen berhasil dihapus" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete" }, { status: 500 });
  }
}
