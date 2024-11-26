import { squareClient } from '@/services/square/config';

export const VENDOR_ID = "57JKL7IHUI73VSU4";
export const VENDOR_NAME = "New Flame Propane";

export async function runVendorTests() {
  try {
    // Fetch vendor details to verify name
    const vendorResponse = await squareClient.vendorsApi.retrieveVendor(VENDOR_ID);
    console.log('Vendor Response:', JSON.stringify(vendorResponse.result));

    // Verify vendor name matches
    if (vendorResponse.result.vendor?.name === VENDOR_NAME) {
      console.log('✅ Vendor name verification passed');
    } else {
      console.error('❌ Vendor name mismatch');
    }
  } catch (error) {
    console.error('Error running vendor tests:', error);
    throw error;
  }
}
