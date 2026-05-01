import PDFDocument from 'pdfkit';
import { getBusinessProfile } from './business';

export function getIndianFinancialYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth(); // Jan = 0, Apr = 3
  const startYear = month >= 3 ? year : year - 1;
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
}

export function formatInvoiceNumber(sequenceValue, date = new Date()) {
  const displaySequence = Math.max(1, Number(sequenceValue) - 1000);
  return `SK/${getIndianFinancialYear(date)}/${String(displaySequence).padStart(5, '0')}`;
}

export function isIntraStateOrder(shippingState, businessState) {
  return normalizeState(shippingState) === normalizeState(businessState);
}

function normalizeState(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function money(value) {
  return `INR ${Number(value || 0).toFixed(2)}`;
}

function calculateInclusiveTax(lineTotal, gstRate, intraState) {
  const rate = Number(gstRate || 0);
  const taxable = rate > 0 ? lineTotal * (100 / (100 + rate)) : lineTotal;
  const tax = lineTotal - taxable;
  return {
    taxable,
    cgst: intraState ? tax / 2 : 0,
    sgst: intraState ? tax / 2 : 0,
    igst: intraState ? 0 : tax,
  };
}

export async function createInvoicePdf({ invoice, order, items, business = getBusinessProfile() }) {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const chunks = [];
  const shippingAddress = typeof order.shipping_address === 'string'
    ? JSON.parse(order.shipping_address || '{}')
    : (order.shipping_address || {});
  const intraState = isIntraStateOrder(shippingAddress.state, business.state);

  doc.on('data', (chunk) => chunks.push(chunk));
  const done = new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

  doc.fontSize(22).text('Spraykart Tax Invoice', { align: 'left' });
  doc.moveDown(0.5);
  doc.fontSize(9).fillColor('#555').text('GST invoice generated for an e-commerce sale in India.');
  doc.fillColor('#000').moveDown();

  const topY = doc.y;
  doc.fontSize(10).text(business.legalName);
  doc.fontSize(9).text(business.address);
  doc.text(`GSTIN: ${business.gstin}`);
  doc.text(`State: ${business.state}`);

  doc.fontSize(9).text(`Invoice No: ${invoice.invoice_number}`, 360, topY);
  doc.text(`Generated: ${new Date(invoice.generated_at).toLocaleString('en-IN')}`, 360);
  doc.text(`Order Date: ${new Date(order.created_at).toLocaleString('en-IN')}`, 360);
  doc.text(`Order ID: ${order.id}`, 360);

  doc.moveDown(2);
  doc.fontSize(11).text('Bill To', { underline: true });
  doc.fontSize(9).text(shippingAddress.name || order.customer_name || 'Customer');
  if (shippingAddress.email || order.customer_email) doc.text(shippingAddress.email || order.customer_email);
  if (shippingAddress.phone) doc.text(shippingAddress.phone);
  doc.text([shippingAddress.line1, shippingAddress.line2, shippingAddress.city, shippingAddress.state, shippingAddress.pincode].filter(Boolean).join(', '));

  doc.moveDown(1.5);
  const startY = doc.y;
  const columns = [40, 185, 240, 285, 335, 395, 455, 515];
  doc.fontSize(8).font('Helvetica-Bold');
  ['Item', 'HSN', 'Qty', 'Taxable', intraState ? 'CGST' : 'IGST', intraState ? 'SGST' : '', 'GST %', 'Total'].forEach((label, i) => {
    if (label) doc.text(label, columns[i], startY, { width: i === 0 ? 140 : 58 });
  });
  doc.moveTo(40, startY + 14).lineTo(555, startY + 14).stroke();
  doc.font('Helvetica');

  let y = startY + 22;
  let taxableTotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;
  let grossTotal = 0;

  for (const item of items) {
    const qty = Number(item.quantity || 0);
    const lineTotal = Number(item.price || 0) * qty;
    const tax = calculateInclusiveTax(lineTotal, item.gst_rate, intraState);
    taxableTotal += tax.taxable;
    cgstTotal += tax.cgst;
    sgstTotal += tax.sgst;
    igstTotal += tax.igst;
    grossTotal += lineTotal;

    if (y > 700) {
      doc.addPage();
      y = 40;
    }
    doc.fontSize(8).text(item.name || 'Product', columns[0], y, { width: 138 });
    doc.text(item.hsn_code || '-', columns[1], y, { width: 48 });
    doc.text(String(qty), columns[2], y, { width: 35 });
    doc.text(money(tax.taxable), columns[3], y, { width: 58 });
    doc.text(money(intraState ? tax.cgst : tax.igst), columns[4], y, { width: 58 });
    if (intraState) doc.text(money(tax.sgst), columns[5], y, { width: 58 });
    doc.text(`${Number(item.gst_rate || 0).toFixed(2)}%`, columns[6], y, { width: 45 });
    doc.text(money(lineTotal), columns[7], y, { width: 50 });
    y += 30;
  }

  const shippingAmount = Math.max(0, Number(order.final_price || 0) - Math.max(0, Number(order.total_price || 0) - Number(order.discount || 0)));
  if (shippingAmount > 0) {
    const tax = calculateInclusiveTax(shippingAmount, 18, intraState);
    taxableTotal += tax.taxable;
    cgstTotal += tax.cgst;
    sgstTotal += tax.sgst;
    igstTotal += tax.igst;
    grossTotal += shippingAmount;
  }

  doc.moveTo(40, y).lineTo(555, y).stroke();
  y += 14;
  doc.fontSize(9);
  doc.text(`Taxable Total: ${money(taxableTotal)}`, 360, y);
  y += 15;
  if (intraState) {
    doc.text(`CGST: ${money(cgstTotal)}`, 360, y);
    y += 15;
    doc.text(`SGST: ${money(sgstTotal)}`, 360, y);
  } else {
    doc.text(`IGST: ${money(igstTotal)}`, 360, y);
  }
  y += 15;
  doc.text(`Discount: ${money(order.discount)}`, 360, y);
  y += 15;
  if (shippingAmount > 0) {
    doc.text(`Shipping: ${money(shippingAmount)}`, 360, y);
    y += 15;
  }
  doc.font('Helvetica-Bold').text(`Invoice Total: ${money(order.final_price || grossTotal)}`, 360, y);

  doc.font('Helvetica').fontSize(8).fillColor('#777').text(
    'This is a computer-generated invoice. Business details are configurable and should be reviewed before payment gateway KYC or customer issuance.',
    40,
    760,
    { width: 515, align: 'center' }
  );

  doc.end();
  return done;
}
