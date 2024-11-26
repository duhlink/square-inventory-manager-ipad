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

export interface LocationOverride {
  location_id: string
  track_inventory: boolean
}

export interface ItemVariationData {
  name?: string
  sku?: string
  price_money?: Money
  measurement_unit_id?: string
  stockable?: boolean
  inventory_alert_threshold?: number
  item_variation_vendor_infos?: VendorInfo[]
  ordinal?: number
  track_inventory?: boolean
  sellable?: boolean
  default_unit_cost?: Money
  location_overrides?: LocationOverride[]
}

export interface ItemVariation {
  id: string
  type: string
  updated_at?: string
  created_at?: string
  version?: number
  is_deleted: boolean
  present_at_all_locations: boolean
  present_at_location_ids?: string[]
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
  present_at_all_locations: boolean
  present_at_location_ids?: string[]
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

export interface CatalogObject {
  id: string
  type: string
  version?: number
  is_deleted: boolean
  updated_at?: string
  present_at_all_locations: boolean
  present_at_location_ids?: string[]
  category_data?: {
    name: string
  }
  image_data?: {
    url?: string
  }
  measurement_unit_data?: {
    measurement_unit?: {
      custom_unit?: {
        name: string
      }
      area_unit?: string
      length_unit?: string
      volume_unit?: string
      weight_unit?: string
      generic_unit?: string
      time_unit?: string
      type?: string
    }
    precision?: number
  }
  item_data?: CatalogItemData
  [key: string]: any
}
