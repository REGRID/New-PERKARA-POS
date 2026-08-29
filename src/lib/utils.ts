import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateItemSku(name: string, category?: string): string {
  const catLower = (category || "").toLowerCase();
  let prefix = "SKU";
  if (catLower.includes("bahan baku")) prefix = "RAW";
  else if (catLower.includes("operasional") || catLower.includes("perlengkapan")) prefix = "OPX";
  else if (catLower.includes("peralatan") || catLower.includes("aset")) prefix = "EQP";

  const cleanName = (name || "ITEM")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const shortCode = cleanName.slice(0, 4).padEnd(3, "X");

  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = (hash << 5) - hash + (name || "").charCodeAt(i);
    hash |= 0;
  }
  const numSuffix = Math.abs(hash % 900) + 100;

  return `${prefix}-${shortCode}-${numSuffix}`;
}

export function detectUnitsFromItemName(name: string): { buyUnit: string; unit: string; conversionRatio: number } {
  const n = (name || "").toLowerCase();
  if (n.includes("karton") || n.includes("crt") || n.includes("dus") || n.includes("box")) {
    return { buyUnit: "Karton", unit: "pcs", conversionRatio: 12 };
  }
  if (n.includes("kg") || n.includes("kilo") || n.includes("kilogram")) {
    return { buyUnit: "Kg", unit: "gram", conversionRatio: 1000 };
  }
  if (n.includes("liter") || n.includes("ltr") || n.includes("lt")) {
    return { buyUnit: "Liter", unit: "ml", conversionRatio: 1000 };
  }
  if (n.includes("pack") || n.includes("pck") || n.includes("bungkus")) {
    return { buyUnit: "Pack", unit: "pcs", conversionRatio: 10 };
  }
  if (n.includes("botol") || n.includes("btl")) {
    return { buyUnit: "Botol", unit: "ml", conversionRatio: 1000 };
  }
  if (n.includes("kaleng") || n.includes("can")) {
    return { buyUnit: "Kaleng", unit: "pcs", conversionRatio: 1 };
  }
  return { buyUnit: "Pcs", unit: "pcs", conversionRatio: 1 };
}
