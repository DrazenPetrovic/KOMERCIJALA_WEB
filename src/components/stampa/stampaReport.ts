import React from "react";
import { pdf, Document } from "@react-pdf/renderer";

import StampaPDFDocument, {
  ReportArtikal,
  ReportTemplateConfig,
} from "./StampaPDFDocument";

// ─── Tipovi ────────────────────────────────────────────────────────────────

export type { ReportArtikal };
export type ReportDocumentType = "PONUDA" | "PREDRACUN" | "OTPREMNICA";

interface GenerateStampaOptions {
  items: ReportArtikal[];
  documentType?: ReportDocumentType;
  template?: Partial<ReportTemplateConfig>;
  filePrefix?: string;
}

// ─── Konstante ─────────────────────────────────────────────────────────────

const DEFAULT_TEMPLATE_BY_TYPE: Record<
  ReportDocumentType,
  ReportTemplateConfig
> = {
  PONUDA: {
    documentTitle: "PONUDA",
    subtitle: "Ponuda artikala iz selekcije",
    documentNumber: "PON-001",
    note: "Napomena: Cene su informativne i podlozne promenama.",
    logoPath: "/foto/MEMORANDUM.jpg",
  },
  PREDRACUN: {
    documentTitle: "PREDRACUN",
    subtitle: "Predracun artikala",
    documentNumber: "PR-001",
    note: "Napomena: Predracun nije fiskalni dokument.",
    logoPath: "/foto/MEMORANDUM.jpg",
  },
  OTPREMNICA: {
    documentTitle: "OTPREMNICA",
    subtitle: "Otprema robe",
    documentNumber: "OT-001",
    note: "Napomena: Molimo proverite robu pri prijemu.",
    logoPath: "/foto/MEMORANDUM.jpg",
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────

const pad2 = (n: number): string => String(n).padStart(2, "0");

const buildFileName = (prefix: string, title: string, now: Date): string => {
  const fileDate =
    `${now.getFullYear()}` +
    `${pad2(now.getMonth() + 1)}` +
    `${pad2(now.getDate())}_` +
    `${pad2(now.getHours())}` +
    `${pad2(now.getMinutes())}` +
    `${pad2(now.getSeconds())}`;
  return `${prefix}_${title.toLowerCase()}_${fileDate}.pdf`;
};

const loadLogoDataUrl = async (
  logoPath?: string,
): Promise<string | undefined> => {
  if (!logoPath) return undefined;
  try {
    const res = await fetch(logoPath);
    if (!res.ok) return undefined;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        typeof reader.result === "string"
          ? resolve(reader.result)
          : reject(new Error("Logo nije ucitan"));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("Logo nije ucitan:", err);
    return undefined;
  }
};

// ─── Glavna funkcija ───────────────────────────────────────────────────────

export const generateStampaReport = async ({
  items,
  documentType = "PONUDA",
  template,
  filePrefix = "stampa",
}: GenerateStampaOptions): Promise<void> => {
  if (items.length === 0) return;

  const now = new Date();
  const defaultTemplate = DEFAULT_TEMPLATE_BY_TYPE[documentType];
  const mergedTemplate: ReportTemplateConfig = {
    ...defaultTemplate,
    ...template,
    documentDate: template?.documentDate ?? now.toLocaleDateString("sr-RS"),
    validUntil:
      template?.validUntil ??
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 7,
      ).toLocaleDateString("sr-RS"),
  };

  const logoDataUrl = await loadLogoDataUrl(mergedTemplate.logoPath);

  const blob = await pdf(
    React.createElement(
      Document,
      null,
      React.createElement(StampaPDFDocument, {
        items,
        config: mergedTemplate,
        logoDataUrl,
      }),
    ),
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = buildFileName(filePrefix, mergedTemplate.documentTitle, now);
  link.click();
  URL.revokeObjectURL(url);
};
