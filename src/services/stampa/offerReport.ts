import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ReportArtikal {
  sifra_proizvoda: number;
  naziv_proizvoda: string;
  jm: string;
  vpc: number;
  mpc: number;
}

export type ReportDocumentType = "PONUDA" | "PREDRACUN" | "OTPREMNICA";

interface ReportTemplateConfig {
  documentTitle: string;
  subtitle?: string;
  documentNumber?: string;
  documentDate?: string;
  validUntil?: string;
  note?: string;
  logoPath?: string;
}

interface GenerateStampaOptions {
  items: ReportArtikal[];
  documentType?: ReportDocumentType;
  template?: Partial<ReportTemplateConfig>;
  filePrefix?: string;
}

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

const formatCurrency = (value: number) =>
  `${value.toLocaleString("sr-RS", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} KM`;

const readBlobAsDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Nije moguce ucitati logo kao Data URL."));
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error("Greska pri ucitavanju loga."));
    reader.readAsDataURL(blob);
  });

const resolveImageType = (logoPath: string): "PNG" | "JPEG" => {
  const normalizedPath = logoPath.toLowerCase();
  if (normalizedPath.endsWith(".jpg") || normalizedPath.endsWith(".jpeg")) {
    return "JPEG";
  }
  return "PNG";
};

const loadLogoDataUrl = async (logoPath?: string) => {
  if (!logoPath) return undefined;

  try {
    const response = await fetch(logoPath);
    if (!response.ok) return undefined;

    const imageBlob = await response.blob();
    return await readBlobAsDataUrl(imageBlob);
  } catch (err) {
    console.warn("Logo nije ucitan iz public putanje:", err);
    return undefined;
  }
};

export const generateStampaReport = async ({
  items,
  documentType = "PONUDA",
  template,
  filePrefix = "stampa",
}: GenerateStampaOptions) => {
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
  const logoType = resolveImageType(mergedTemplate.logoPath ?? "");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const accentColor: [number, number, number] = [120, 94, 158];
  const horizontalPadding = 14;
  const topImageHeight = 34;

  let headerBottomY = 10;

  if (logoDataUrl) {
    try {
      // Memorandum/header ide preko cele sirine dokumenta.
      doc.addImage(logoDataUrl, logoType, 0, 0, pageWidth, topImageHeight);
      headerBottomY = topImageHeight;
    } catch (err) {
      console.warn("Logo nije dodat u dokument:", err);
    }
  }

  doc.setDrawColor(...accentColor);
  doc.setLineWidth(1.1);
  doc.line(0, headerBottomY + 2, pageWidth, headerBottomY + 2);

  const titleY = headerBottomY + 14;

  doc.setTextColor(...accentColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  doc.text(mergedTemplate.documentTitle, pageWidth / 2, titleY, {
    align: "center",
  });

  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);

  const rightMeta = [
    `Broj dokumenta: ${mergedTemplate.documentNumber ?? "-"}`,
    `Datum: ${mergedTemplate.documentDate ?? "-"}`,
    `Vazi do: ${mergedTemplate.validUntil ?? "-"}`,
  ];

  const rightMetaStartY = headerBottomY + 8;
  rightMeta.forEach((line, index) => {
    doc.text(line, pageWidth - horizontalPadding, rightMetaStartY + index * 5, {
      align: "right",
    });
  });

  const tableStartY = Math.max(
    titleY + 8,
    rightMetaStartY + rightMeta.length * 5 + 3,
  );

  autoTable(doc, {
    startY: tableStartY,
    head: [["R.br", "Sifra", "Naziv", "JM", "VPC", "MPC"]],
    body: items.map((artikal, index) => [
      index + 1,
      artikal.sifra_proizvoda,
      artikal.naziv_proizvoda,
      artikal.jm,
      formatCurrency(artikal.vpc),
      formatCurrency(artikal.mpc),
    ]),
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 2.2,
    },
    headStyles: {
      fillColor: accentColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 14 },
      1: { halign: "center", cellWidth: 22 },
      2: { cellWidth: "auto" },
      3: { halign: "center", cellWidth: 16 },
      4: { halign: "right", cellWidth: 28 },
      5: { halign: "right", cellWidth: 28 },
    },
    margin: { left: horizontalPadding, right: horizontalPadding },
    theme: "striped",
    alternateRowStyles: { fillColor: [248, 248, 252] },
  });

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(230, 230, 235);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(90, 90, 90);
    doc.text(
      "Karpas ambalaže doo, Ložionička bb Banja Luka",
      14,
      pageHeight - 9,
    );
    doc.text(`Strana ${page}/${totalPages}`, pageWidth - 14, pageHeight - 9, {
      align: "right",
    });
  }

  const pad2 = (n: number) => String(n).padStart(2, "0");

  const fileDate =
    `${now.getFullYear()}` +
    `${pad2(now.getMonth() + 1)}` +
    `${pad2(now.getDate())}_` +
    `${pad2(now.getHours())}` +
    `${pad2(now.getMinutes())}` +
    `${pad2(now.getSeconds())}`;

  doc.save(
    `${filePrefix}_${mergedTemplate.documentTitle.toLowerCase()}_${fileDate}.pdf`,
  );
};
