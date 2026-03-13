// import React from "react";
// import {
//   Document,
//   Page,
//   Text,
//   View,
//   Image,
//   StyleSheet,
//   pdf,
// } from "@react-pdf/renderer";

// // ─── Tipovi ────────────────────────────────────────────────────────────────

// export interface ReportArtikal {
//   sifra_proizvoda: number;
//   naziv_proizvoda: string;
//   jm: string;
//   vpc: number;
//   mpc: number;
// }

// export type ReportDocumentType = "PONUDA" | "PREDRACUN" | "OTPREMNICA";

// interface ReportTemplateConfig {
//   documentTitle: string;
//   subtitle?: string;
//   documentNumber?: string;
//   documentDate?: string;
//   validUntil?: string;
//   note?: string;
//   logoPath?: string;
// }

// interface GenerateStampaOptions {
//   items: ReportArtikal[];
//   documentType?: ReportDocumentType;
//   template?: Partial<ReportTemplateConfig>;
//   filePrefix?: string;
// }

// // ─── Konstante ─────────────────────────────────────────────────────────────

// const ACCENT: string = "#785E9E";
// const ACCENT_LIGHT: string = "#F8F8FC";
// const TEXT_DARK: string = "#282828";
// const TEXT_MUTED: string = "#5A5A5A";
// const BORDER: string = "#E6E6EB";

// const DEFAULT_TEMPLATE_BY_TYPE: Record<
//   ReportDocumentType,
//   ReportTemplateConfig
// > = {
//   PONUDA: {
//     documentTitle: "PONUDA",
//     subtitle: "Ponuda artikala iz selekcije",
//     documentNumber: "PON-001",
//     note: "Napomena: Cene su informativne i podlozne promenama.",
//     logoPath: "/foto/MEMORANDUM.jpg",
//   },
//   PREDRACUN: {
//     documentTitle: "PREDRACUN",
//     subtitle: "Predracun artikala",
//     documentNumber: "PR-001",
//     note: "Napomena: Predracun nije fiskalni dokument.",
//     logoPath: "/foto/MEMORANDUM.jpg",
//   },
//   OTPREMNICA: {
//     documentTitle: "OTPREMNICA",
//     subtitle: "Otprema robe",
//     documentNumber: "OT-001",
//     note: "Napomena: Molimo proverite robu pri prijemu.",
//     logoPath: "/foto/MEMORANDUM.jpg",
//   },
// };

// // ─── Helpers ───────────────────────────────────────────────────────────────

// const formatCurrency = (value: number): string =>
//   `${value.toLocaleString("sr-RS", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   })} KM`;

// const pad2 = (n: number): string => String(n).padStart(2, "0");

// const buildFileName = (prefix: string, title: string, now: Date): string => {
//   const fileDate =
//     `${now.getFullYear()}` +
//     `${pad2(now.getMonth() + 1)}` +
//     `${pad2(now.getDate())}_` +
//     `${pad2(now.getHours())}` +
//     `${pad2(now.getMinutes())}` +
//     `${pad2(now.getSeconds())}`;
//   return `${prefix}_${title.toLowerCase()}_${fileDate}.pdf`;
// };

// // ─── Stilovi ───────────────────────────────────────────────────────────────

// const styles = StyleSheet.create({
//   page: {
//     fontFamily: "Helvetica",
//     fontSize: 9,
//     color: TEXT_DARK,
//     paddingBottom: 40,
//   },

//   // Header
//   headerImage: {
//     width: "100%",
//     height: 96, // ~34mm
//   },
//   accentLine: {
//     height: 3,
//     backgroundColor: ACCENT,
//     marginTop: 2,
//   },

//   // Title area
//   titleRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "flex-start",
//     paddingHorizontal: 14,
//     marginTop: 8,
//     marginBottom: 6,
//   },
//   documentTitle: {
//     fontSize: 21,
//     fontFamily: "Helvetica-Bold",
//     color: ACCENT,
//     flex: 1,
//     textAlign: "center",
//   },
//   metaBlock: {
//     fontSize: 9,
//     color: TEXT_DARK,
//     textAlign: "right",
//     lineHeight: 1.6,
//     minWidth: 160,
//   },
//   metaLabel: {
//     fontFamily: "Helvetica-Bold",
//   },

//   // Subtitle
//   subtitle: {
//     paddingHorizontal: 14,
//     fontSize: 9,
//     color: TEXT_MUTED,
//     marginBottom: 6,
//     textAlign: "center",
//   },

//   // Tabela
//   tableContainer: {
//     paddingHorizontal: 14,
//   },
//   tableHeader: {
//     flexDirection: "row",
//     backgroundColor: ACCENT,
//     borderRadius: 2,
//     paddingVertical: 5,
//     paddingHorizontal: 4,
//   },
//   tableRow: {
//     flexDirection: "row",
//     paddingVertical: 4,
//     paddingHorizontal: 4,
//     borderBottomWidth: 0.5,
//     borderBottomColor: BORDER,
//   },
//   tableRowAlt: {
//     backgroundColor: ACCENT_LIGHT,
//   },

//   // Kolone — širine u pt (A4 = 595pt, margine 2×14=28, preostaje ~539)
//   colRbr: { width: 28, textAlign: "center" },
//   colSifra: { width: 44, textAlign: "center" },
//   colNaziv: { flex: 1 },
//   colJm: { width: 28, textAlign: "center" },
//   colVpc: { width: 56, textAlign: "right" },
//   colMpc: { width: 56, textAlign: "right" },

//   thText: {
//     color: "#FFFFFF",
//     fontFamily: "Helvetica-Bold",
//     fontSize: 8.5,
//   },
//   tdText: {
//     fontSize: 8.5,
//     color: TEXT_DARK,
//   },

//   // Suma
//   sumRow: {
//     flexDirection: "row",
//     justifyContent: "flex-end",
//     paddingHorizontal: 14,
//     marginTop: 6,
//     gap: 24,
//   },
//   sumLabel: {
//     fontSize: 9,
//     fontFamily: "Helvetica-Bold",
//     color: ACCENT,
//   },
//   sumValue: {
//     fontSize: 9,
//     fontFamily: "Helvetica-Bold",
//     color: TEXT_DARK,
//     width: 80,
//     textAlign: "right",
//   },

//   // Napomena
//   noteBox: {
//     marginHorizontal: 14,
//     marginTop: 10,
//     padding: 7,
//     backgroundColor: ACCENT_LIGHT,
//     borderLeftWidth: 3,
//     borderLeftColor: ACCENT,
//     borderRadius: 2,
//   },
//   noteText: {
//     fontSize: 8,
//     color: TEXT_MUTED,
//     lineHeight: 1.5,
//   },

//   // Footer
//   footer: {
//     position: "absolute",
//     bottom: 14,
//     left: 14,
//     right: 14,
//     borderTopWidth: 0.5,
//     borderTopColor: BORDER,
//     paddingTop: 4,
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   footerText: {
//     fontSize: 7.5,
//     color: TEXT_MUTED,
//   },
// });

// // ─── Komponenta dokumenta ──────────────────────────────────────────────────

// interface StampaPDFProps {
//   items: ReportArtikal[];
//   config: ReportTemplateConfig;
//   logoDataUrl?: string;
// }

// const StampaPDF: React.FC<StampaPDFProps> = ({
//   items,
//   config,
//   logoDataUrl,
// }) => {
//   const totalVpc = items.reduce((s, a) => s + a.vpc, 0);
//   const totalMpc = items.reduce((s, a) => s + a.mpc, 0);

//   const metaLines = [
//     { label: "Broj dokumenta: ", value: config.documentNumber ?? "-" },
//     { label: "Datum: ", value: config.documentDate ?? "-" },
//     { label: "Vazi do: ", value: config.validUntil ?? "-" },
//   ];

//   return (
//     <Document>
//       <Page size="A4" style={styles.page}>
//         {/* ── Header slika ── */}
//         {logoDataUrl && <Image src={logoDataUrl} style={styles.headerImage} />}
//         <View style={styles.accentLine} />

//         {/* ── Naslov + meta ── */}
//         <View style={styles.titleRow}>
//           {/* Lijeva praznina (balansira desni meta blok) */}
//           <View style={{ minWidth: 160 }} />

//           <Text style={styles.documentTitle}>{config.documentTitle}</Text>

//           <View style={[styles.metaBlock, { minWidth: 160 }]}>
//             {metaLines.map((m) => (
//               <Text key={m.label}>
//                 <Text style={styles.metaLabel}>{m.label}</Text>
//                 {m.value}
//               </Text>
//             ))}
//           </View>
//         </View>

//         {config.subtitle && (
//           <Text style={styles.subtitle}>{config.subtitle}</Text>
//         )}

//         {/* ── Tabela ── */}
//         <View style={styles.tableContainer}>
//           {/* Header */}
//           <View style={styles.tableHeader}>
//             <Text style={[styles.colRbr, styles.thText]}>R.br</Text>
//             <Text style={[styles.colSifra, styles.thText]}>Sifra</Text>
//             <Text style={[styles.colNaziv, styles.thText]}>Naziv</Text>
//             <Text style={[styles.colJm, styles.thText]}>JM</Text>
//             <Text style={[styles.colVpc, styles.thText]}>VPC</Text>
//             <Text style={[styles.colMpc, styles.thText]}>MPC</Text>
//           </View>

//           {/* Redovi */}
//           {items.map((artikal, index) => (
//             <View
//               key={artikal.sifra_proizvoda}
//               style={[
//                 styles.tableRow,
//                 index % 2 === 1 ? styles.tableRowAlt : {},
//               ]}
//               wrap={false}
//             >
//               <Text style={[styles.colRbr, styles.tdText]}>{index + 1}</Text>
//               <Text style={[styles.colSifra, styles.tdText]}>
//                 {artikal.sifra_proizvoda}
//               </Text>
//               <Text style={[styles.colNaziv, styles.tdText]}>
//                 {artikal.naziv_proizvoda}
//               </Text>
//               <Text style={[styles.colJm, styles.tdText]}>{artikal.jm}</Text>
//               <Text style={[styles.colVpc, styles.tdText]}>
//                 {formatCurrency(artikal.vpc)}
//               </Text>
//               <Text style={[styles.colMpc, styles.tdText]}>
//                 {formatCurrency(artikal.mpc)}
//               </Text>
//             </View>
//           ))}
//         </View>

//         {/* ── Napomena ── */}
//         {config.note && (
//           <View style={styles.noteBox}>
//             <Text style={styles.noteText}>{config.note}</Text>
//           </View>
//         )}

//         {/* ── Footer (fixed) ── */}
//         <View style={styles.footer} fixed>
//           <Text style={styles.footerText}>
//             Karpas ambalaze doo, Lozionicka bb Banja Luka
//           </Text>
//           <Text
//             style={styles.footerText}
//             render={({ pageNumber, totalPages }) =>
//               `Strana ${pageNumber}/${totalPages}`
//             }
//           />
//         </View>
//       </Page>
//     </Document>
//   );
// };

// // ─── Glavna funkcija (isti interfejs kao prije) ─────────────────────────────

// export const generateStampaReport = async ({
//   items,
//   documentType = "PONUDA",
//   template,
//   filePrefix = "stampa",
// }: GenerateStampaOptions): Promise<void> => {
//   if (items.length === 0) return;

//   const now = new Date();
//   const defaultTemplate = DEFAULT_TEMPLATE_BY_TYPE[documentType];
//   const mergedTemplate: ReportTemplateConfig = {
//     ...defaultTemplate,
//     ...template,
//     documentDate: template?.documentDate ?? now.toLocaleDateString("sr-RS"),
//     validUntil:
//       template?.validUntil ??
//       new Date(
//         now.getFullYear(),
//         now.getMonth(),
//         now.getDate() + 7,
//       ).toLocaleDateString("sr-RS"),
//   };

//   // Učitaj logo
//   let logoDataUrl: string | undefined;
//   if (mergedTemplate.logoPath) {
//     try {
//       const res = await fetch(mergedTemplate.logoPath);
//       if (res.ok) {
//         const blob = await res.blob();
//         logoDataUrl = await new Promise<string>((resolve, reject) => {
//           const reader = new FileReader();
//           reader.onloadend = () =>
//             typeof reader.result === "string"
//               ? resolve(reader.result)
//               : reject(new Error("Logo nije ucitan"));
//           reader.onerror = () => reject(reader.error);
//           reader.readAsDataURL(blob);
//         });
//       }
//     } catch (err) {
//       console.warn("Logo nije ucitan:", err);
//     }
//   }

//   // Generiši i preuzmi PDF
//   const blob = await pdf(
//     <StampaPDF
//       items={items}
//       config={mergedTemplate}
//       logoDataUrl={logoDataUrl}
//     />,
//   ).toBlob();

//   const url = URL.createObjectURL(blob);
//   const link = document.createElement("a");
//   link.href = url;
//   link.download = buildFileName(filePrefix, mergedTemplate.documentTitle, now);
//   link.click();
//   URL.revokeObjectURL(url);
// };
