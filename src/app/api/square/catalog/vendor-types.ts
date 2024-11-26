import { CatalogObject } from 'square'

export interface VendorInfoData {
  ordinal: number
  sku: string
  item_variation_id: string
  vendor_id: string
}

export interface VendorInfo {
  type: string
  id: string
  updated_at: string
  created_at: string
  version: number
  is_deleted: boolean
  present_at_all_locations: boolean
  present_at_location_ids: string[]
  item_variation_vendor_info_data: VendorInfoData
}

export interface ItemVariationData {
  item_id: string
  name: string
  sku: string
  ordinal: number
  pricing_type: string
  price_money?: {
    amount: number
    currency: string
  }
  location_overrides?: Array<{
    location_id: string
    track_inventory: boolean
  }>
  item_variation_vendor_infos?: VendorInfo[]
  item_variation_vendor_info_ids?: string[]
}

export interface CatalogItemVariation extends CatalogObject {
  itemVariationData: ItemVariationData
}

export interface VendorMapping {
  itemId: string
  vendorId: string
}

export interface VendorExtractResult {
  itemVendorMap: Map<string, string>
  vendorIds: Set<string>
}

export interface ItemVendorData {
  vendorId?: string
  vendorName?: string
  vendorCode?: string
}

// Debug logging interfaces
export interface VendorDebugInfo {
  item_id: string
  item_name?: string
  variation_id: string
  vendor_info: VendorInfoData
}

export interface VendorMappingDebug {
  id: string
  name: string
}

export interface VendorProcessingDebug {
  total_items: number
  items_with_vendors: number
  unique_vendors: number
  vendor_details: Array<{
    item_id: string
    item_name?: string
    vendor_id: string
    variations: Array<{
      variation_id: string
      variation_name?: string
      variation_sku?: string
      vendor_sku?: string
    }>
  }>
}

export interface VendorResponseDebug {
  request: {
    vendor_ids: string[]
    timestamp: string
  }
  response: {
    vendors?: Array<{
      id: string
      name?: string
      status?: string
      created_at?: string
      updated_at?: string
      retrieved_at: string
    }>
    errors?: Array<{
      category: string
      code: string
      detail: string
    }>
  }
}

export interface VendorMappingSummary {
  total_requested: number
  total_retrieved: number
  vendor_mappings: Array<{
    id: string
    name: string
  }>
}

export interface CatalogVendorInfo {
  page: number
  vendor_info: Array<{
    item_id: string
    item_name?: string
    variations: Array<{
      variation_id: string
      vendor_infos: VendorInfo[]
    }>
  }>
}
