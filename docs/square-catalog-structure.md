# Square Catalog API Structure

## Overview
Documentation of the Square Catalog API response structure, focusing on key elements needed for filtering and data organization.

## Key Identifiers for Filtering

### Vendor IDs
Located in `itemVariationVendorInfos[].itemVariationVendorInfoData.vendorId`

### Category IDs
Located in `itemData.categories[].id`
Categories are used for organizing items into groups.

## Main Object Structure

### Catalog Item
```typescript
{
  type: "ITEM"
  id: string           // Unique Square catalog item ID
  updated_at: string   // ISO timestamp
  created_at: string   // ISO timestamp
  version: string      // Version number
  is_deleted: boolean
  present_at_location_ids: string[]
  absent_at_location_ids?: string[]
  
  item_data: {
    name: string
    description?: string
    abbreviation?: string
    label_color?: string
    is_taxable: boolean
    visibility: "PRIVATE" | "PUBLIC"
    available_online: boolean
    available_for_pickup: boolean
    available_electronically: boolean
    tax_ids: string[]
    categories: Array<{
      id: string      // Category ID for filtering
      ordinal: number
    }>
    variations: CatalogItemVariation[]
  }
}
```

### Catalog Item Variation
```typescript
{
  type: "ITEM_VARIATION"
  id: string
  updated_at: string
  created_at: string
  version: string
  is_deleted: boolean
  present_at_location_ids: string[]
  
  item_variation_data: {
    item_id: string
    name: string
    sku?: string
    ordinal: number
    pricing_type: "FIXED_PRICING" | "VARIABLE_PRICING"
    price_money?: {
      amount: number    // In smallest currency unit (cents)
      currency: string  // e.g. "USD"
    }
    location_overrides?: Array<{
      location_id: string
      track_inventory?: boolean
      sold_out?: boolean
    }>
    track_inventory: boolean
    inventory_alert_type: string
    sellable: boolean
    stockable: boolean
    
    item_variation_vendor_info_ids?: string[]
    item_variation_vendor_infos?: Array<{
      id: string
      version: string
      item_variation_vendor_info_data: {
        vendor_id: string    // Vendor ID for filtering
        sku?: string
        price_money?: {
          amount: number
          currency: string
        }
      }
    }>
  }
}
```

## Common Fields

### Price Money
```typescript
{
  amount: number    // In smallest currency unit (cents)
  currency: string  // Usually "USD"
}
```

### Location Override
```typescript
{
  location_id: string
  track_inventory?: boolean
  sold_out?: boolean
  pricing_type?: string
}
```

### Category
```typescript
{
  id: string      // Used for filtering
  ordinal: number // Used for sorting
}
```

## Important Notes

1. **Vendor Information**
   - Vendor details are nested within item variations
   - Each variation can have multiple vendor infos
   - Vendor IDs are crucial for filtering by supplier

2. **Categories**
   - Items can belong to multiple categories
   - Categories have ordinal values for sorting
   - Category IDs are used for filtering and organization

3. **Pricing**
   - Prices are stored in smallest currency unit (cents)
   - Can be fixed or variable pricing
   - Location-specific pricing possible through overrides

4. **Inventory**
   - Track inventory can be enabled/disabled
   - Location-specific inventory tracking
   - Sold out status can be set per location

5. **Visibility**
   - Items can be private or public
   - Controls visibility in Square's interfaces
   - Affects online availability

## Common Operations

### Filtering by Vendor
```javascript
items.filter(item => 
  item.variations.some(variation =>
    variation.item_variation_vendor_infos?.some(info =>
      info.item_variation_vendor_info_data.vendor_id === targetVendorId
    )
  )
)
```

### Filtering by Category
```javascript
items.filter(item =>
  item.item_data.categories?.some(category =>
    category.id === targetCategoryId
  )
)
```

### Getting Item Price
```javascript
const getPrice = (item) => {
  const variation = item.variations[0]
  return variation?.item_variation_data?.price_money?.amount || 0
}
