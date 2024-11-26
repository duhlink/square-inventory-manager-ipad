export interface Money {
  amount?: number
  currency?: string
}

export interface VendorInfoData {
  vendor_id: string
  sku?: string
}

export interface VendorInfo {
  item_variation_vendor_info_data: VendorInfoData
}

export interface ItemVariationData {
  name?: string
  sku?: string
  price_money?: Money
  measurement_unit_id?: string
  stockable?: boolean
  inventory_alert_threshold?: number
  item_variation_vendor_infos?: VendorInfo[]
}

export interface ItemVariation {
  id: string
  item_variation_data: ItemVariationData
}

export interface CatalogCategory {
  id: string
  ordinal: number
}

export interface CatalogItemData {
  name: string
  description?: string
  variations?: ItemVariation[]
  category_ids?: string[]
  categories?: CatalogCategory[]
  image_ids?: string[]
  is_taxable?: boolean
  available_online?: boolean
  available_for_pickup?: boolean
}

export interface CatalogItem {
  id: string
  type: string
  version?: number
  is_deleted: boolean
  updated_at?: string
  item_data?: CatalogItemData
}

export interface CategoryOption {
  value: string
  label: string
}

export interface ItemCategoryMapping {
  item_id: string
  item_name?: string
  category_ids: string[]
}
