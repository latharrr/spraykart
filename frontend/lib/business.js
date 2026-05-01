const DEFAULT_SITE_URL = 'https://spraykart.in';

export const FREE_SHIPPING_THRESHOLD = Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD || 999);
export const STANDARD_SHIPPING_FEE = Number(process.env.NEXT_PUBLIC_STANDARD_SHIPPING_FEE || 49);

export function getBusinessProfile() {
  const name = process.env.NEXT_PUBLIC_BUSINESS_NAME || 'Spraykart';
  return {
    name,
    legalName: process.env.BUSINESS_LEGAL_NAME || process.env.NEXT_PUBLIC_BUSINESS_LEGAL_NAME || `${name} [Legal Entity Name]`,
    address: process.env.BUSINESS_ADDRESS || process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || '[Registered business address, India]',
    email: process.env.BUSINESS_EMAIL || process.env.NEXT_PUBLIC_BUSINESS_EMAIL || process.env.ADMIN_EMAIL || 'support@spraykart.in',
    phone: process.env.BUSINESS_PHONE || process.env.NEXT_PUBLIC_BUSINESS_PHONE || '[Business phone number]',
    gstin: process.env.BUSINESS_GSTIN || 'GSTIN to be updated',
    state: process.env.BUSINESS_STATE || 'Delhi',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL,
    supportHours: process.env.NEXT_PUBLIC_SUPPORT_HOURS || 'Monday to Saturday, 10:00 AM to 6:00 PM IST',
  };
}

export function formatInr(amount) {
  return `Rs. ${Number(amount || 0).toLocaleString('en-IN')}`;
}
