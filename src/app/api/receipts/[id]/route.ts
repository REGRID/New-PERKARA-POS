import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAdminUserFromRequest, requireRole } from "@/lib/authHelper";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse } = await requireRole(req, ["admin", "karyawan"]);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const { data: receipt, error } = await supabase
      .from("receipts")
      .select("*, items:receipt_items(*)")
      .eq("id", id)
      .single();

    if (error || !receipt) {
      return NextResponse.json({ error: "Nota tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(receipt);
  } catch (error: any) {
    console.error("GET Single Receipt Error:", error);
    return NextResponse.json({ error: "Gagal memuat detail nota" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse, session } = await requireRole(req, ["admin", "karyawan"]);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const adminUser = session?.name || getAdminUserFromRequest(req);
    const body = await req.json();
    const { date, items, directUpdate } = body;

    if (!date) {
      return NextResponse.json({ error: "Tanggal nota wajib diisi" }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Nota harus memiliki minimal 1 item produk" }, { status: 400 });
    }

    if (directUpdate) {
      // Direct Admin Update
      const { data: updatedReceipt, error: updateErr } = await supabase
        .from("receipts")
        .update({
          merchantName: body.merchantName || "Nota / Toko",
          date: body.date,
          subtotal: Number(body.subtotal) || 0,
          taxAmount: Number(body.taxAmount) || 0,
          totalAmount: Number(body.totalAmount) || 0,
          paymentMethod: body.paymentMethod || "Cash",
          paymentStatus: body.paymentStatus || "Lunas",
          note: body.note || null,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .single();

      if (updateErr) throw new Error(updateErr.message);

      // Re-insert items
      await supabase.from("receipt_items").delete().eq("receiptId", id);
      const newItems = items.map((it: any) => ({
        receiptId: id,
        name: it.name || "Item",
        category: it.category ? it.category.split("/")[0].trim() : "Lain-lain",
        subCategory: it.subCategory || "Umum",
        price: Number(it.price) || 0,
        quantity: Number(it.quantity) || 1,
      }));
      await supabase.from("receipt_items").insert(newItems);

      return NextResponse.json({ success: true, receipt: updatedReceipt });
    }

    // Create Pending Approval for EDIT action in Supabase
    const { data: approval, error } = await supabase
      .from("pending_approvals")
      .insert({
        receiptId: id,
        actionType: "EDIT",
        requestedBy: adminUser,
        status: "PENDING",
        payload: JSON.stringify(body),
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      pendingApproval: true,
      message: `Permintaan edit nota berhasil diajukan oleh ${adminUser}. Menunggu verifikasi dari admin lain.`,
      approval,
    });
  } catch (error: any) {
    console.error("PUT Receipt Error:", error);
    return NextResponse.json({ error: error.message || "Gagal mengajukan edit nota" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { errorResponse, session } = await requireRole(req, ["admin"]);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const adminUser = session?.name || getAdminUserFromRequest(req);

    // Create Pending Approval for DELETE action in Supabase
    const { data: approval, error } = await supabase
      .from("pending_approvals")
      .insert({
        receiptId: id,
        actionType: "DELETE",
        requestedBy: adminUser,
        status: "PENDING",
        payload: JSON.stringify({ id }),
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      pendingApproval: true,
      message: `Permintaan hapus nota berhasil diajukan oleh ${adminUser}. Menunggu verifikasi dari admin lain.`,
      approval,
    });
  } catch (error: any) {
    console.error("DELETE Receipt Error:", error);
    return NextResponse.json({ error: "Gagal mengajukan penghapusan nota" }, { status: 500 });
  }
}
