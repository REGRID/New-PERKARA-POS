"use client";

import React, { useState, useRef, useCallback } from "react";
import { extractTextFromReceipt } from "@/lib/ocr";
import { ReceiptImageUpload, BatchFileItem } from "@/components/receipts/ReceiptImageUpload";
import { VerificationSplitScreen } from "@/components/receipts/VerificationSplitScreen";
import { ReceiptHistoryDashboard } from "@/components/receipts/ReceiptHistoryDashboard";
import { SettingsModal } from "@/components/receipts/SettingsModal";
import { ParsedReceiptResult } from "@/app/api/parse-receipt/route";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth-context";
import { 
  Camera, 
  History, 
  Settings,
  CheckCircle2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ReceiptUploadPage() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<"scan" | "history">("scan");
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Scanning State
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState("");
  const [ocrPercent, setOcrPercent] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Batch Queue State for Mass Upload
  const [batchQueue, setBatchQueue] = useState<BatchFileItem[]>([]);
  const [batchIndex, setBatchIndex] = useState(0);
  const [batchToast, setBatchToast] = useState<string | null>(null);

  // Verification & Editing State
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [rawOcrText, setRawOcrText] = useState("");
  const [parsedResult, setParsedResult] = useState<ParsedReceiptResult | null>(null);
  const [parsingMode, setParsingMode] = useState<string>("gemini_multimodal_vision");
  const [quotaError, setQuotaError] = useState<string | null>(null);

  // Saved Receipt Editing State
  const [editingReceiptId, setEditingReceiptId] = useState<string | null>(null);
  const [existingPaymentMethod, setExistingPaymentMethod] = useState<string>("Cash");
  const [existingPaymentStatus, setExistingPaymentStatus] = useState<string>("Lunas");
  const [existingNote, setExistingNote] = useState<string>("");

  const processNextInBatch = useCallback(
    async (queue: BatchFileItem[], nextIdx: number) => {
      if (nextIdx >= queue.length) {
        setBatchToast(`Semua ${queue.length} nota dalam antrean batch selesai diproses!`);
        setTimeout(() => setBatchToast(null), 4000);
        setBatchQueue([]);
        setBatchIndex(0);
        setImagePreviewUrl(null);
        setParsedResult(null);
        setActiveTab("history");
        return;
      }

      setBatchIndex(nextIdx);
      const currentItem = queue[nextIdx];
      setImagePreviewUrl(currentItem.base64);
      setParsedResult(null);
      setIsProcessing(true);
      setOcrStatus(`Membaca Nota ${nextIdx + 1} dari ${queue.length}...`);
      setOcrPercent(0);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        let extractedText = "";
        try {
          extractedText = await extractTextFromReceipt(currentItem.file, (prog) => {
            setOcrStatus(`OCR Tesseract (${prog.status})`);
            setOcrPercent(Math.round(prog.progress * 100));
          });
        } catch {
          extractedText = "Nota Belanja";
        }
        setRawOcrText(extractedText);

        setOcrStatus("Menganalisis dengan Google Gemini AI Vision...");
        const response = await fetch("/api/parse-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: currentItem.base64,
            ocrText: extractedText,
          }),
          signal: controller.signal,
        });

        const resData = await response.json();

        if (response.ok && resData.result) {
          setParsedResult(resData.result);
          setParsingMode(resData.mode || "gemini_multimodal_vision");
          setQuotaError(null);
        } else {
          setParsedResult({
            merchantName: "Nota / Toko",
            date: new Date().toISOString().split("T")[0],
            subtotal: 0,
            taxAmount: 0,
            totalAmount: 0,
            items: [{ name: "Item", category: "Bahan Baku", subCategory: "Umum", price: 0, quantity: 1 }],
          });
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Batch parse error:", err);
        }
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const handleImageSelected = async (file: File, base64: string) => {
    setImagePreviewUrl(base64);
    setEditingReceiptId(null);
    setExistingPaymentMethod("Cash");
    setExistingPaymentStatus("Lunas");
    setExistingNote("");
    setBatchQueue([]);
    setBatchIndex(0);
    setIsProcessing(true);
    setOcrStatus("Memindai Teks dengan OCR...");
    setOcrPercent(0);
    setQuotaError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      let extractedText = "";
      try {
        extractedText = await extractTextFromReceipt(file, (prog) => {
          setOcrStatus(`Tesseract OCR: ${prog.status}`);
          setOcrPercent(Math.round(prog.progress * 100));
        });
      } catch {
        extractedText = "Nota Belanja";
      }
      setRawOcrText(extractedText);

      setOcrStatus("Menganalisis Multimodal AI Gemini...");
      const response = await fetch("/api/parse-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          ocrText: extractedText,
        }),
        signal: controller.signal,
      });

      const resData = await response.json();

      if (response.ok && resData.result) {
        setParsedResult(resData.result);
        setParsingMode(resData.mode || "gemini_multimodal_vision");
      } else {
        setParsedResult({
          merchantName: "Nota / Toko",
          date: new Date().toISOString().split("T")[0],
          subtotal: 0,
          taxAmount: 0,
          totalAmount: 0,
          items: [{ name: "Item", category: "Bahan Baku", subCategory: "Umum", price: 0, quantity: 1 }],
        });
        if (resData.error === "QUOTA_EXCEEDED") {
          setQuotaError(resData.message);
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Scan error:", err);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchSelected = (batch: BatchFileItem[]) => {
    if (batch.length === 0) return;
    setBatchQueue(batch);
    setBatchToast(`Memulai proses batch ${batch.length} nota...`);
    setTimeout(() => setBatchToast(null), 3000);
    processNextInBatch(batch, 0);
  };

  const handleCancelScan = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsProcessing(false);
    setImagePreviewUrl(null);
    setParsedResult(null);
  };

  const handleSaveSuccess = () => {
    if (batchQueue.length > 1 && batchIndex + 1 < batchQueue.length) {
      processNextInBatch(batchQueue, batchIndex + 1);
    } else {
      setBatchToast("Nota berhasil diverifikasi dan tersimpan!");
      setTimeout(() => setBatchToast(null), 3000);
      setImagePreviewUrl(null);
      setParsedResult(null);
      setEditingReceiptId(null);
      setActiveTab("history");
    }
  };

  const handleSkipBatch = () => {
    if (batchQueue.length > 1 && batchIndex + 1 < batchQueue.length) {
      processNextInBatch(batchQueue, batchIndex + 1);
    } else {
      setImagePreviewUrl(null);
      setParsedResult(null);
      setBatchQueue([]);
    }
  };

  const handleCancelVerification = () => {
    setImagePreviewUrl(null);
    setParsedResult(null);
    setEditingReceiptId(null);
    setBatchQueue([]);
  };

  const handleEditReceipt = (receipt: any) => {
    setEditingReceiptId(receipt.id);
    setImagePreviewUrl(receipt.imageUrl || null);
    setExistingPaymentMethod(receipt.paymentMethod || "Cash");
    setExistingPaymentStatus(receipt.paymentStatus || "Lunas");
    setExistingNote(receipt.note || "");
    setParsedResult({
      merchantName: receipt.merchantName,
      date: receipt.date,
      subtotal: receipt.subtotal,
      taxAmount: receipt.taxAmount,
      totalAmount: receipt.totalAmount,
      items: (receipt.items || []).map((it: any) => ({
        name: it.name,
        category: it.category,
        subCategory: it.subCategory || "Umum",
        price: it.price,
        quantity: it.quantity,
      })),
    });
  };

  const handleDraftUpdate = (
    updatedResult: ParsedReceiptResult,
    extraFields: { paymentMethod: string; paymentStatus: string; note: string }
  ) => {
    setParsedResult(updatedResult);
    setExistingPaymentMethod(extraFields.paymentMethod);
    setExistingPaymentStatus(extraFields.paymentStatus);
    setExistingNote(extraFields.note);
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Toast Alert */}
        {batchToast && (
          <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-3 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{batchToast}</span>
          </div>
        )}

        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Scan Nota Belanja AI (Nota-Photo)
                </h1>
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 font-semibold">
                  Dual-Sync Supabase &amp; POS
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pemindai struk fisik dengan AI Gemini Vision, Self-Learning Memory, dan Sinkronisasi Otomatis ke Stok Bahan Baku &amp; OPEX.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab Buttons */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => {
                  if (isProcessing) return;
                  setImagePreviewUrl(null);
                  setActiveTab("scan");
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === "scan" && !imagePreviewUrl
                    ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-extrabold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Scan Nota</span>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => {
                  if (isProcessing) return;
                  setImagePreviewUrl(null);
                  setActiveTab("history");
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === "history" && !imagePreviewUrl
                    ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-extrabold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                <History className="w-4 h-4" />
                <span>Riwayat &amp; Analitik</span>
              </button>
            </div>

            {/* Settings Button */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="p-2.5 rounded-xl border bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
                title="Pengaturan Kategori & Status Database"
              >
                <Settings className="w-4 h-4 text-emerald-600" />
              </button>
            )}
          </div>
        </div>

        {/* Body Content */}
        {imagePreviewUrl && parsedResult ? (
          <VerificationSplitScreen
            imagePreviewUrl={imagePreviewUrl}
            rawOcrText={rawOcrText}
            initialResult={parsedResult}
            parsingMode={parsingMode}
            editingReceiptId={editingReceiptId}
            existingPaymentMethod={existingPaymentMethod}
            existingPaymentStatus={existingPaymentStatus}
            existingNote={existingNote}
            batchInfo={batchQueue.length > 1 ? { currentIndex: batchIndex, totalCount: batchQueue.length } : null}
            onSkipBatch={handleSkipBatch}
            onSaveSuccess={handleSaveSuccess}
            onCancel={handleCancelVerification}
            onDraftUpdate={handleDraftUpdate}
          />
        ) : activeTab === "scan" ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            <ReceiptImageUpload
              onImageSelected={handleImageSelected}
              onBatchSelected={handleBatchSelected}
              onCancelScan={handleCancelScan}
              isProcessing={isProcessing}
              ocrProgressStatus={ocrStatus}
              ocrProgressPercent={ocrPercent}
              quotaError={quotaError}
            />
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            <ReceiptHistoryDashboard
              onScanNewReceipt={() => setActiveTab("scan")}
              onEditReceipt={handleEditReceipt}
              currentAdminUser={user?.name || "admin"}
            />
          </div>
        )}

        {/* Settings Modal */}
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          currentAdminUser={user?.name || "admin"}
        />
      </div>
    </AppShell>
  );
}
