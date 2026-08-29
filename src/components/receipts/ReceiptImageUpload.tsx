"use client";

import React, { useState, useEffect } from "react";
import {
  Upload,
  Camera,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  Clock,
  RotateCw,
  RotateCcw,
  Play,
  Lock,
  Layers,
  Maximize2,
} from "lucide-react";
import { rotateImageBase64, compressImageBase64 } from "@/lib/ocr";
import { ImageInteractiveLightbox } from "@/components/receipts/ImageInteractiveLightbox";

export interface BatchFileItem {
  file: File;
  base64: string;
}

interface ReceiptImageUploadProps {
  onImageSelected: (file: File, base64: string) => void;
  onBatchSelected?: (batch: BatchFileItem[]) => void;
  onCancelScan?: () => void;
  isProcessing: boolean;
  ocrProgressStatus?: string;
  ocrProgressPercent?: number;
  quotaError?: string | null;
}

export function ReceiptImageUpload({
  onImageSelected,
  onBatchSelected,
  onCancelScan,
  isProcessing,
  ocrProgressStatus,
  ocrProgressPercent = 0,
  quotaError,
}: ReceiptImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [batchBase64s, setBatchBase64s] = useState<string[]>([]);
  const [_currentFileIndex, setCurrentFileIndex] = useState(0);
  const [selectedBase64, setSelectedBase64] = useState<string | null>(null);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (!isProcessing) {
      setShowCancelConfirm(false);
    }
  }, [isProcessing]);

  useEffect(() => {
    let interval: any = null;
    if (isProcessing) {
      setTimerSeconds(0);
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setTimerSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isProcessing]);

  const processFileToSquareBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const rawBase64 = e.target?.result as string;
        const squareBase64 = await compressImageBase64(rawBase64, 1400, 1400, 0.85);
        resolve(squareBase64);
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  };

  const handleFilesChosen = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.type.startsWith("image/") || /\.(jpe?g|png|webp|heic)$/i.test(f.name)) {
        validFiles.push(f);
      }
    }

    if (validFiles.length === 0) return;

    setIsCompressing(true);
    try {
      const base64List: string[] = [];
      for (const file of validFiles) {
        const b64 = await processFileToSquareBase64(file);
        if (b64) base64List.push(b64);
      }

      if (base64List.length > 0) {
        setSelectedFiles(validFiles);
        setBatchBase64s(base64List);
        setCurrentFileIndex(0);
        setSelectedBase64(base64List[0]);
        setRotationDegrees(0);
      }
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRotateLeft = async () => {
    if (!selectedBase64) return;
    const newRot = (rotationDegrees - 90 + 360) % 360;
    setRotationDegrees(newRot);
    const rotated = await rotateImageBase64(selectedBase64, 270);
    setSelectedBase64(rotated);
  };

  const handleRotateRight = async () => {
    if (!selectedBase64) return;
    const newRot = (rotationDegrees + 90) % 360;
    setRotationDegrees(newRot);
    const rotated = await rotateImageBase64(selectedBase64, 90);
    setSelectedBase64(rotated);
  };

  const handleStartScan = () => {
    if (!selectedBase64 || selectedFiles.length === 0) return;

    if (selectedFiles.length > 1 && onBatchSelected) {
      const batchItems: BatchFileItem[] = selectedFiles.map((file, idx) => ({
        file,
        base64: batchBase64s[idx] || selectedBase64,
      }));
      onBatchSelected(batchItems);
    } else {
      onImageSelected(selectedFiles[0], selectedBase64);
    }
  };

  const triggerFileInput = (id: string) => {
    const inputEl = document.getElementById(id) as HTMLInputElement | null;
    if (inputEl) {
      inputEl.value = "";
      inputEl.click();
    }
  };

  const isQuotaReached = !!quotaError;

  return (
    <div className="w-full space-y-4">
      {/* Hidden Native File Inputs */}
      <input
        type="file"
        id="gallery-file-input"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFilesChosen(e.target.files)}
      />
      <input
        type="file"
        id="camera-file-input"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFilesChosen(e.target.files)}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFilesChosen(e.dataTransfer.files);
        }}
        className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all ${
          isDragOver
            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
            : "border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 shadow-xs"
        }`}
      >
        {isProcessing ? (
          /* PROCESSING SPINNER / STATUS */
          <div className="flex flex-col items-center space-y-4 py-8">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-emerald-100 dark:border-emerald-950 border-t-emerald-600 animate-spin flex items-center justify-center" />
              <Sparkles className="w-8 h-8 text-emerald-600 absolute inset-0 m-auto animate-pulse" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {ocrProgressStatus || "Sedang Membaca Nota..."}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {ocrProgressPercent > 0 ? `Progres: ${ocrProgressPercent}%` : "Menganalisis teks & struktur tabel..."}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-4 h-4" />
              <span>Waktu: {timerSeconds}s</span>
            </div>

            {onCancelScan && (
              <div className="pt-2">
                {showCancelConfirm ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onCancelScan}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700"
                    >
                      Ya, Batalkan
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(false)}
                      className="px-3 py-1.5 rounded-lg border text-xs text-slate-600"
                    >
                      Kembali
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(true)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                  >
                    Batalkan Proses
                  </button>
                )}
              </div>
            )}
          </div>
        ) : selectedBase64 ? (
          /* IMAGE SELECTED PREVIEW & CONTROLS */
          <div className="flex flex-col items-center space-y-4">
            <div
              onClick={() => setShowLightbox(true)}
              className="relative max-w-sm max-h-80 w-full h-64 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border shadow-md cursor-zoom-in group"
              title="Klik untuk memperbesar foto"
            >
              {isCompressing ? (
                <div className="flex flex-col items-center justify-center space-y-2 text-emerald-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-xs font-bold">Mengompres Foto...</span>
                </div>
              ) : (
                <>
                  <img
                    src={selectedBase64}
                    alt="Nota Selected"
                    className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                    style={{ transform: `rotate(${rotationDegrees}deg)` }}
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white pointer-events-none">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/90 flex items-center justify-center shadow-lg">
                      <Maximize2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[11px] font-bold bg-slate-900/90 px-2.5 py-1 rounded-full border border-slate-700">
                      Klik untuk perbesar
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRotateLeft}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Putar Kiri
              </button>

              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl">
                {rotationDegrees}°
              </span>

              <button
                type="button"
                onClick={handleRotateRight}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                <RotateCw className="w-4 h-4" /> Putar Kanan
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full max-w-sm">
              <button
                type="button"
                onClick={() => {
                  setSelectedBase64(null);
                  setSelectedFiles([]);
                  setBatchBase64s([]);
                }}
                className="w-full sm:w-auto px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Ganti
              </button>

              <button
                type="button"
                disabled={isQuotaReached || isCompressing}
                onClick={handleStartScan}
                className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-black text-sm transition-all shadow-md active:scale-95 cursor-pointer ${
                  isQuotaReached || isCompressing
                    ? "bg-slate-400 text-slate-200 cursor-not-allowed shadow-none"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30"
                }`}
              >
                {isQuotaReached ? (
                  <>
                    <Lock className="w-4 h-4" /> Kuota Habis
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    {selectedFiles.length > 1
                      ? `Scan Batch (${selectedFiles.length})`
                      : "Scan Nota AI"}
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* INITIAL UPLOAD AREA */
          <div className="flex flex-col items-center space-y-4">
            <label
              htmlFor={isQuotaReached ? undefined : "gallery-file-input"}
              className={`group flex flex-col items-center space-y-3 ${
                isQuotaReached ? "cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-inner transition-transform ${
                  isQuotaReached
                    ? "bg-slate-200 text-slate-400"
                    : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 group-hover:scale-110"
                }`}
              >
                {isQuotaReached ? <Lock className="w-8 h-8 sm:w-10 sm:h-10" /> : <Upload className="w-8 h-8 sm:w-10 sm:h-10" />}
              </div>

              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
                  {isQuotaReached ? "Kendala Kuota / API Key" : "Unggah Nota Fisik"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  {isQuotaReached
                    ? (quotaError || "Batas frekuensi Google Gemini API tercapai atau API Key tidak valid.")
                    : "Pilih foto nota dari galeri atau ambil langsung dengan kamera HP / Tablet."}
                </p>
              </div>
            </label>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full max-w-md pt-2">
              <button
                type="button"
                disabled={isQuotaReached || isProcessing}
                onClick={() => triggerFileInput("gallery-file-input")}
                className={`inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 ${
                  isQuotaReached || isProcessing
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                    : "bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white cursor-pointer"
                }`}
              >
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                Buka Galeri
              </button>

              <button
                type="button"
                disabled={isQuotaReached || isProcessing}
                onClick={() => triggerFileInput("camera-file-input")}
                className={`inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 ${
                  isQuotaReached || isProcessing
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                    : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white cursor-pointer"
                }`}
              >
                <Camera className="w-4 h-4 text-white" />
                Ambil Foto
              </button>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3 text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-emerald-600" /> Mendukung upload banyak foto sekaligus (Batch)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Interactive Lightbox Modal */}
      {showLightbox && selectedBase64 && (
        <ImageInteractiveLightbox
          imageUrl={selectedBase64}
          altText="Preview Detail Nota"
          onClose={() => setShowLightbox(false)}
        />
      )}
    </div>
  );
}
