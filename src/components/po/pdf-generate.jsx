import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer';
import aceLogo from '../../assets/ace-logo.png';

// Create styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 30,
    paddingLeft: 30,
    paddingRight: 30,
    paddingBottom: 40,
    position: 'relative'
  },
  container: {
    border: '1pt solid #000',
    flex: 1
  },
  // 1. Header
  headerRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #000',
  },
  logoBox: {
    width: 130,
    padding: 5,
    borderRight: '1pt solid #000',
    justifyContent: 'center',
    alignItems: 'center'
  },
  logoImage: {
    maxHeight: 60,
    objectFit: 'contain'
  },
  companyBox: {
    flex: 1,
  },
  companyNameRow: {
    backgroundColor: '#4A90E2',
    color: '#fff',
    padding: 8,
    textAlign: 'center',
  },
  companyNameText: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1
  },
  companyAddress: {
    textAlign: 'center',
    padding: 3,
    borderBottom: '0.5pt solid #000',
    fontFamily: 'Helvetica-Bold'
  },
  poTitle: {
    textAlign: 'center',
    padding: 3,
    fontFamily: 'Helvetica-Bold'
  },
  
  // 2. Supplier & PO Info
  infoRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #000',
    minHeight: 50
  },
  supplierBox: {
    flex: 1,
    padding: 6,
    borderRight: '1pt solid #000'
  },
  infoField: {
    flexDirection: 'row',
    marginBottom: 3
  },
  infoLabel: {
    width: 50,
    fontFamily: 'Helvetica-Bold'
  },
  infoValue: {
    flex: 1,
  },
  poBox: {
    width: 150,
    padding: 6,
    justifyContent: 'center'
  },
  poField: {
    flexDirection: 'row',
    marginBottom: 5
  },
  poLabel: {
    width: 50,
    fontFamily: 'Helvetica-Bold'
  },
  poValue: {
    flex: 1
  },

  // 3. Commercial Details
  commercialGrid: {
    flexDirection: 'row',
    borderBottom: '1pt solid #000',
  },
  commCol: {
    flex: 1,
    borderRight: '1pt solid #000',
  },
  commColLast: {
    flex: 1,
  },
  commHeader: {
    backgroundColor: '#4A90E2',
    color: '#fff',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    padding: 3,
    borderBottom: '0.5pt solid #000',
  },
  commFieldRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #000',
  },
  commFieldRowLast: {
    flexDirection: 'row'
  },
  commLabel: {
    width: 50,
    fontFamily: 'Helvetica-Bold',
    borderRight: '0.5pt solid #000',
    padding: 3,
  },
  commValue: {
    flex: 1,
    padding: 3,
  },
  commCenteredVal: {
    textAlign: 'center',
    padding: 3,
    borderBottom: '0.5pt solid #000',
    fontFamily: 'Helvetica-Bold'
  },
  commMultiline: {
    textAlign: 'center',
    padding: 3
  },

  // Dear Sir
  greetingBox: {
    padding: 8,
    borderBottom: '1pt solid #000'
  },
  greetingText: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 5
  },

  // Table
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#4A90E2',
    color: '#fff',
    borderBottom: '1pt solid #000',
  },
  tableHeaderCell: {
    padding: 3,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    textAlign: 'center',
    borderRight: '0.5pt solid #000',
    justifyContent: 'center'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #000',
  },
  tableCell: {
    padding: 3,
    fontSize: 7,
    textAlign: 'center',
    borderRight: '0.5pt solid #000',
    justifyContent: 'center'
  },
  tableCellLeft: {
    padding: 3,
    fontSize: 7,
    textAlign: 'left',
    borderRight: '0.5pt solid #000',
    justifyContent: 'center'
  },

  // Col widths (matching HTML layout closely)
  colSn: { width: '4%' },
  colIndent: { width: '10%' },
  colCode: { width: '11%' },
  colGroup: { width: '13%' },
  colProduct: { flex: 1 },
  colQty: { width: '6%' },
  colUnit: { width: '6%' },
  colRate: { width: '8%' },
  colDisc: { width: '7%' },
  colGst: { width: '6%' },
  colAmount: { width: '11%', borderRight: 'none' }, // last cell no border right

  grandTotalRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #000',
  },
  grandTotalLabel: {
    flex: 1,
    padding: 3,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    borderRight: '0.5pt solid #000'
  },
  grandTotalValue: {
    width: '11%',
    padding: 3,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    fontSize: 8
  },

  // Terms and conditions
  termsBox: {
    borderTop: '2pt solid #000',
    flex: 1
  },
  termsTitle: {
    backgroundColor: '#4A90E2',
    color: '#fff',
    fontFamily: 'Helvetica-Bold',
    padding: 3,
    paddingLeft: 6,
    textTransform: 'uppercase',
    marginBottom: 5
  },
  termRow: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 6,
    paddingRight: 6
  },
  termNum: { width: 15, fontFamily: 'Helvetica-Bold', fontSize: 8 },
  termLabel: { width: 80, fontFamily: 'Helvetica-Bold', fontSize: 8 },
  termVal: { flex: 1, fontSize: 8 },
  ackText: {
    marginTop: 8,
    paddingLeft: 6,
    paddingBottom: 8,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8
  },

  // Footer page numbers
  pageNumber: {
    position: 'absolute',
    fontSize: 8,
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#666'
  }
});

// The Document Component
export const POPDFDocument = ({ data }) => {
  // calculate totals
  const totals = data.items.reduce((acc, item) => {
    const q = parseFloat(item.quantity) || 0;
    const r = parseFloat(item.rate) || 0;
    const d = parseFloat(item.discount) || 0;
    const g = parseFloat(item.gst) || 0;
    const afterDiscount = q * r * (1 - d / 100);
    const totalWithGst = afterDiscount * (1 + g / 100);
    acc.grandTotal += totalWithGst;
    return acc;
  }, { grandTotal: 0 });

  const emptyRows = Array.from({ length: 1 });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          
          {/* 1. Header */}
          <View style={styles.headerRow}>
            <View style={styles.logoBox}>
              <Image src={aceLogo} style={styles.logoImage} />
            </View>
            <View style={styles.companyBox}>
              <View style={styles.companyNameRow}>
                <Text style={styles.companyNameText}>{data.companyName}</Text>
              </View>
              <Text style={styles.companyAddress}>Changurabhata, Raipur, Chhattisgarh</Text>
              <Text style={styles.poTitle}>Purchase Order</Text>
            </View>
          </View>

          {/* 2. Supplier & PO Info */}
          <View style={styles.infoRow}>
            <View style={styles.supplierBox}>
              <View style={styles.infoField}>
                <Text style={styles.infoLabel}>Supplier:- </Text>
                <Text style={[styles.infoValue, { color: '#1976d2', fontFamily: 'Helvetica-Bold' }]}>{data.vendorName || '—'}</Text>
              </View>
              <View style={styles.infoField}>
                <Text style={styles.infoLabel}>Address:- </Text>
                <Text style={styles.infoValue}>{data.vendorAddress}</Text>
              </View>
              <View style={styles.infoField}>
                <Text style={styles.infoLabel}>GSTIN:- </Text>
                <Text style={styles.infoValue}>{data.vendorGst}</Text>
              </View>
            </View>
            <View style={styles.poBox}>
              <View style={styles.poField}>
                <Text style={styles.poLabel}>PO No : </Text>
                <Text style={styles.poValue}>{data.poNumber}</Text>
              </View>
              <View style={styles.poField}>
                <Text style={styles.poLabel}>PO Date : </Text>
                <Text style={styles.poValue}>{data.poDate}</Text>
              </View>
            </View>
          </View>

          {/* 3. Commercial Details */}
          <View style={styles.commercialGrid}>
            <View style={styles.commCol}>
              <Text style={styles.commHeader}>Our Commercial Details</Text>
              <View style={styles.commFieldRow}>
                <Text style={styles.commLabel}>GSTIN</Text>
                <Text style={styles.commValue}>{data.companyGst}</Text>
              </View>
              <View style={styles.commFieldRowLast}>
                <Text style={styles.commLabel}>PAN No.</Text>
                <Text style={styles.commValue}>{data.companyPan}</Text>
              </View>
            </View>
            <View style={styles.commCol}>
              <Text style={styles.commHeader}>Billing Address</Text>
              <Text style={styles.commCenteredVal}>{data.companyName}</Text>
              <Text style={styles.commMultiline}>{data.billingAddress}</Text>
            </View>
            <View style={styles.commColLast}>
              <Text style={styles.commHeader}>Destination Address</Text>
              <Text style={styles.commCenteredVal}>{data.companyName}</Text>
              <Text style={styles.commMultiline}>{data.destinationAddress}</Text>
            </View>
          </View>

          <View style={styles.greetingBox}>
            <Text style={styles.greetingText}>Dear Sir,</Text>
            <Text style={styles.greetingText}>We Are Pleased To Place Our Purchase Order With You, As Per The Following Details.</Text>
          </View>

          {/* 4. Items Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colSn]}>S/N</Text>
              <Text style={[styles.tableHeaderCell, styles.colIndent]}>Indent No.</Text>
              <Text style={[styles.tableHeaderCell, styles.colCode]}>Product Code</Text>
              <Text style={[styles.tableHeaderCell, styles.colGroup]}>Group</Text>
              <Text style={[styles.tableHeaderCell, styles.colProduct]}>Product</Text>
              <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
              <Text style={[styles.tableHeaderCell, styles.colUnit]}>Unit</Text>
              <Text style={[styles.tableHeaderCell, styles.colRate]}>Rate</Text>
              <Text style={[styles.tableHeaderCell, styles.colDisc]}>Discount %</Text>
              <Text style={[styles.tableHeaderCell, styles.colGst]}>GST %</Text>
              <Text style={[styles.tableHeaderCell, styles.colAmount, { borderRight: 'none' }]}>Amount</Text>
            </View>
            
            {data.items.map((item, idx) => {
              const q = parseFloat(item.quantity) || 0;
              const r = parseFloat(item.rate) || 0;
              const d = parseFloat(item.discount) || 0;
              const g = parseFloat(item.gst) || 0;
              const afterDiscount = q * r * (1 - d / 100);
              const totalWithGst = afterDiscount * (1 + g / 100);
              return (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colSn]}>{idx + 1}</Text>
                  <Text style={[styles.tableCell, styles.colIndent, { color: '#1565c0', fontFamily: 'Helvetica-Bold' }]}>{item.indentNumber}</Text>
                  <Text style={[styles.tableCell, styles.colCode]}>{item.itemCode}</Text>
                  <Text style={[styles.tableCellLeft, styles.colGroup]}>{item.groupName}</Text>
                  <Text style={[styles.tableCellLeft, styles.colProduct]}>{item.description}</Text>
                  <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                  <Text style={[styles.tableCell, styles.colUnit]}>{item.unit}</Text>
                  <Text style={[styles.tableCell, styles.colRate]}>{item.rate}</Text>
                  <Text style={[styles.tableCell, styles.colDisc]}>{item.discount}</Text>
                  <Text style={[styles.tableCell, styles.colGst]}>{item.gst}</Text>
                  <Text style={[styles.tableCell, styles.colAmount, { borderRight: 'none', fontFamily: 'Helvetica-Bold' }]}>{Math.round(totalWithGst)}</Text>
                </View>
              );
            })}
            
            {emptyRows.map((_, idx) => (
              <View key={`empty-${idx}`} style={[styles.tableRow, { height: 18 }]}>
                <Text style={[styles.tableCell, styles.colSn]}></Text>
                <Text style={[styles.tableCell, styles.colIndent]}></Text>
                <Text style={[styles.tableCell, styles.colCode]}></Text>
                <Text style={[styles.tableCellLeft, styles.colGroup]}></Text>
                <Text style={[styles.tableCellLeft, styles.colProduct]}></Text>
                <Text style={[styles.tableCell, styles.colQty]}></Text>
                <Text style={[styles.tableCell, styles.colUnit]}></Text>
                <Text style={[styles.tableCell, styles.colRate]}></Text>
                <Text style={[styles.tableCell, styles.colDisc]}></Text>
                <Text style={[styles.tableCell, styles.colGst]}></Text>
                <Text style={[styles.tableCell, styles.colAmount, { borderRight: 'none' }]}></Text>
              </View>
            ))}

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>{Math.round(totals.grandTotal)}</Text>
            </View>
          </View>

          {/* Terms & Conditions */}
          <View style={styles.termsBox} wrap={false}>
            <Text style={styles.termsTitle}>TERMS &amp; CONDITIONS</Text>
            <View style={styles.termRow}>
              <Text style={styles.termNum}>1</Text>
              <Text style={styles.termLabel}>Price Basis :</Text>
              <Text style={styles.termVal}>{data.priceBasis}</Text>
            </View>
            <View style={styles.termRow}>
              <Text style={styles.termNum}>2</Text>
              <Text style={styles.termLabel}>Taxes &amp; Duties :</Text>
              <Text style={styles.termVal}>{data.taxesDuties}</Text>
            </View>
            <View style={styles.termRow}>
              <Text style={styles.termNum}>3</Text>
              <Text style={styles.termLabel}>Delivery :</Text>
              <Text style={styles.termVal}>{data.delivery}</Text>
            </View>
            <View style={styles.termRow}>
              <Text style={styles.termNum}>4</Text>
              <Text style={styles.termLabel}>Transport :</Text>
              <Text style={styles.termVal}>{data.transport}</Text>
            </View>
            <View style={styles.termRow}>
              <Text style={styles.termNum}>5</Text>
              <Text style={styles.termLabel}>Payment :</Text>
              <Text style={styles.termVal}>{data.paymentTerms}</Text>
            </View>
            <View style={styles.termRow}>
              <Text style={styles.termNum}>6</Text>
              <Text style={styles.termLabel}>Dispatch Date :</Text>
              <Text style={styles.termVal}>{data.dispatchDate}</Text>
            </View>

            <Text style={styles.ackText}>Kindly Acknowledge Receipt Of This Purchase Order Along With Its Enclosures, And Ensure Timely Execution Of The Ordered Material.</Text>
          </View>
        </View>

        {/* Page Footer */}
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} of ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
};

// Helper function to generate PDF blob
export const generatePoPdfBlob = async (data) => {
  const blob = await pdf(<POPDFDocument data={data} />).toBlob();
  return blob;
};
