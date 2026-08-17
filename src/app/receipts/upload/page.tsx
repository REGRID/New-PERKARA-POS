"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Camera, 
  Upload, 
  ArrowLeft, 
  Sparkles, 
  FileText,
  Boxes,
  ClipboardList
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/app-shell";
import { parsePhotoReceipt } from "@/lib/ocr-receipt-parser";

export default function UploadReceiptPage() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcessReceipt = async () => {
    if (!selectedImage) return;
    setIsProcessing(true);
    try {
      await parsePhotoReceipt(selectedImage);
      router.push("/receipts/verify/demo-receipt-1");
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Scan Nota Belanja Fisik (AI)</h1>
              <p className="text-xs text-muted-foreground">Upload nota fisik untuk menambah stok bahan baku atau mencatat beban operasional OPEX</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-bold">Upload Foto Nota</CardTitle>
              <CardDescription className="text-xs">
                Gunakan kamera tablet/HP untuk mengambil foto nota pembelian supplier atau struk tagihan.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              
              {selectedImage ? (
                <div className="relative rounded-2xl overflow-hidden border max-h-96 flex justify-center bg-muted/40 p-2">
                  <img src={selectedImage} alt="Foto Nota" className="object-contain max-h-92 rounded-xl" />
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-4 right-4 min-h-[36px] text-xs font-semibold shadow-md"
                  >
                    Ganti Foto
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl hover:border-rose-400 bg-rose-50/20 hover:bg-rose-50/40 dark:bg-rose-950/10 cursor-pointer transition-all min-h-[220px]">
                  <div className="p-3.5 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 mb-3 border border-rose-200 dark:border-rose-900">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-sm text-foreground">Ambil Foto / Pilih Berkas Nota</span>
                  <span className="text-xs text-muted-foreground mt-1">Format JPG, PNG, atau WebP</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}

              <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 dark:bg-indigo-950/20 dark:border-indigo-900/60 text-xs text-muted-foreground space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-indigo-950 dark:text-indigo-200">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Klasifikasi Otomatis Engine:</span>
                </div>
                <p className="flex items-center gap-2">
                  <Boxes className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span><strong className="text-foreground">Bahan Baku</strong>: Otomatis menambah stok di inventaris & update HPP riil.</span>
                </p>
                <p className="flex items-center gap-2">
                  <ClipboardList className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span><strong className="text-foreground">Beban Operasional</strong>: Masuk laporan OPEX bulanan tanpa mempengaruhi stok.</span>
                </p>
              </div>

            </CardContent>

            <CardFooter>
              <Button 
                size="lg" 
                disabled={!selectedImage || isProcessing}
                onClick={handleProcessReceipt}
                className="w-full min-h-[46px] bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-2 shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isProcessing ? "Memproses Nota AI..." : "Proses Nota Sekarang"}</span>
              </Button>
            </CardFooter>
          </Card>
        </div>

      </div>
    </AppShell>
  );
}
