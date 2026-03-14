import React from "react";
import { Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { formatCurrency } from "./matematickeFunkcije";
// ─── Tipovi ────────────────────────────────────────────────────────────────

export interface ReportArtikal {
  sifra_proizvoda: number;
  naziv_proizvoda: string;
  jm: string;
  vpc: number;
  mpc: number;
}

export interface ReportTemplateConfig {
  documentTitle: string;
  subtitle?: string;
  documentNumber?: string;
  documentDate?: string;
  validUntil?: string;
  note?: string;
  logoPath?: string;
}

export interface StampaPDFProps {
  items: ReportArtikal[];
  config: ReportTemplateConfig;
  logoDataUrl?: string;
}

// ─── Konstante ─────────────────────────────────────────────────────────────

const ACCENT = "#785E9E";
const ACCENT_LIGHT = "#F8F8FC";
const TEXT_DARK = "#282828";
const TEXT_MUTED = "#5A5A5A";
const BORDER = "#E6E6EB";

// ─── Helpers ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: TEXT_DARK,
    paddingTop: 0,
    paddingLeft: 14,
    paddingRight: 14,
    paddingBottom: 40,
  },
  headerImage: {
    width: "100%",
    height: 96,
    marginLeft: -14, // izlazi iz paddinga da ide do ruba
    marginRight: -14,
  },
  accentLine: {
    height: 3,
    backgroundColor: ACCENT,
    marginTop: 2,
    marginLeft: -14, // isto kao header
    marginRight: -14,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 8,
    marginBottom: 6,
  },
  documentTitle: {
    fontSize: 21,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
    flex: 1,
    textAlign: "center",
  },
  metaBlock: {
    fontSize: 9,
    color: TEXT_DARK,
    textAlign: "right",
    lineHeight: 1.6,
    minWidth: 160,
  },
  metaLabel: {
    fontFamily: "Helvetica-Bold",
  },
  subtitle: {
    fontSize: 9,
    color: TEXT_MUTED,
    marginBottom: 6,
    textAlign: "center",
  },
  tableContainer: {
    // paddingHorizontal uklonjen - naslijeđuje od page
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: ACCENT,
    borderRadius: 2,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  tableRowAlt: {
    backgroundColor: ACCENT_LIGHT,
  },
  colRbr: { width: 28, textAlign: "center" },
  colSifra: { width: 44, textAlign: "center" },
  colNaziv: { flex: 1 },
  colJm: { width: 28, textAlign: "center" },
  colVpc: { width: 56, textAlign: "right" },
  colMpc: { width: 56, textAlign: "right" },
  thText: {
    color: "#FFFFFF",
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
  },
  tdText: {
    fontSize: 8.5,
    color: TEXT_DARK,
  },
  sumRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 6,
    gap: 24,
  },
  sumLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
  },
  sumValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: TEXT_DARK,
    width: 80,
    textAlign: "right",
  },
  noteBox: {
    marginTop: 10,
    padding: 7,
    backgroundColor: ACCENT_LIGHT,
    borderLeftWidth: 3,
    borderLeftColor: ACCENT,
    borderRadius: 2,
  },
  noteText: {
    fontSize: 8,
    color: TEXT_MUTED,
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    paddingTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7.5,
    color: TEXT_MUTED,
  },
});
// ─── Komponenta ────────────────────────────────────────────────────────────

const StampaPDFDocument: React.FC<StampaPDFProps> = ({
  items,
  config,
  logoDataUrl,
}) => {
  const metaLines = [
    { label: "Broj dokumenta: ", value: config.documentNumber ?? "-" },
    { label: "Datum: ", value: config.documentDate ?? "-" },
    { label: "Vazi do: ", value: config.validUntil ?? "-" },
  ];

  return (
    <Page size="A4" style={styles.page}>
      {logoDataUrl && <Image src={logoDataUrl} style={styles.headerImage} />}
      <View style={styles.accentLine} />

      <View style={styles.titleRow}>
        <View style={{ minWidth: 160 }} />
        <Text style={styles.documentTitle}>{config.documentTitle}</Text>
        <View style={[styles.metaBlock, { minWidth: 160 }]}>
          {metaLines.map((m) => (
            <Text key={m.label}>
              <Text style={styles.metaLabel}>{m.label}</Text>
              {m.value}
            </Text>
          ))}
        </View>
      </View>

      {config.subtitle && (
        <Text style={styles.subtitle}>{config.subtitle}</Text>
      )}

      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.colRbr, styles.thText]}>R.br</Text>
          <Text style={[styles.colSifra, styles.thText]}>Sifra</Text>
          <Text style={[styles.colNaziv, styles.thText]}>Naziv</Text>
          <Text style={[styles.colJm, styles.thText]}>JM</Text>
          <Text style={[styles.colVpc, styles.thText]}>VPC</Text>
          <Text style={[styles.colMpc, styles.thText]}>MPC</Text>
        </View>

        {items.map((artikal, index) => (
          <View
            key={artikal.sifra_proizvoda}
            style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
            wrap={false}
          >
            <Text style={[styles.colRbr, styles.tdText]}>{index + 1}</Text>
            <Text style={[styles.colSifra, styles.tdText]}>
              {artikal.sifra_proizvoda}
            </Text>
            <Text style={[styles.colNaziv, styles.tdText]}>
              {artikal.naziv_proizvoda}
            </Text>
            <Text style={[styles.colJm, styles.tdText]}>{artikal.jm}</Text>
            <Text style={[styles.colVpc, styles.tdText]}>
              {formatCurrency(artikal.vpc)}
            </Text>
            <Text style={[styles.colMpc, styles.tdText]}>
              {formatCurrency(artikal.mpc)}
            </Text>
          </View>
        ))}
      </View>

      {config.note && (
        <View style={styles.noteBox}>
          <Text style={styles.noteText}>{config.note}</Text>
        </View>
      )}

      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>
          Karpas ambalaze doo, Lozionicka bb Banja Luka
        </Text>
        <Text
          style={styles.footerText}
          render={({ pageNumber, totalPages }) =>
            `Strana ${pageNumber}/${totalPages}`
          }
        />
      </View>
    </Page>
  );
};

export default StampaPDFDocument;
