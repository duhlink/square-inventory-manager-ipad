# Square Catalog API Structure

## API Query Example
```bash
curl https://connect.squareup.com/v2/catalog/list?types=ITEM \
  -H 'Square-Version: 2024-11-20' \
  -H 'Authorization: Bearer EAAAl7jn6--qEQf4iuFDvdTLzYgWNwIxBRj5HkBIm_vGcZuAzkmq95dLi8W-QqaE' \
  -H 'Content-Type: application/json'
```

## Core Object Structure
- `objects`: Array of catalog items
- `cursor`: Pagination cursor for fetching next set of results

## Item Object Structure

### Base Fields
- `type`: Type of catalog object (e.g., "ITEM")
- `id`: Unique identifier for the catalog item
- `updated_at`: Last update timestamp
- `created_at`: Creation timestamp
- `version`: Version number
- `is_deleted`: Boolean indicating if item is deleted
- `present_at_all_locations`: Boolean for availability across locations
- `present_at_location_ids`: Array of location IDs where item is available

### Item Data (`item_data`)
- `name`: Item name/title
- `description`: Detailed item description
- `is_taxable`: Boolean for tax status
- `visibility`: Visibility setting (e.g., "PRIVATE")
- `tax_ids`: Array of applicable tax IDs

### Important IDs for Filtering

#### Vendor IDs
Found in: `item_variation_vendor_infos[].item_variation_vendor_info_data.vendor_id`
Common vendor IDs:
- `57JKL7IHUI73VSU4`: Primary vendor
- `WBEGKGP7O4ZWECWE`: Secondary vendor
- `ZCM653GICPPVKIL6`: Tank supplier
- `7ICMMTGL3KN64UFH`: Parts supplier

#### Category IDs
Found in: `categories[].id`
Notable categories:
- `YNC3BF4AER2UMH7TRYSJCFGY`: Propane and Gas
- `AXNGYK6KC64YSKIZW26IKXM2`: Tanks and Cylinders
- `POUKQJLEPWYQ7224LMAGDWLT`: Services
- `KCZK2FYWLMB6BBEHEB4OVRGW`: Accessories
- `GU5LKBH3BKJFBLL5RMWUFTBN`: Installation Equipment

### Variations Structure
- Located in: `item_data.variations[]`
- Contains:
  - `id`: Unique variation ID
  - `type`: Always "ITEM_VARIATION"
  - `item_variation_data`:
    - `price_money`: Price information
    - `sku`: Stock keeping unit
    - `track_inventory`: Inventory tracking flag
    - `sellable`: If item can be sold
    - `stockable`: If item can be stocked

### Pricing Structure
- Found in: `variations[].item_variation_data.price_money`
- Contains:
  - `amount`: Price in smallest currency unit (cents)
  - `currency`: Currency code (e.g., "USD")

### Inventory Management
- `track_inventory`: Boolean for inventory tracking
- `inventory_alert_type`: Type of inventory alerts
- `inventory_alert_threshold`: Alert threshold level

### Channel Information
- `channels`: Array of sales channels
- `ecom_uri`: E-commerce URI
- `ecom_image_uris`: Array of image URIs
- `ecom_available`: E-commerce availability flag
- `ecom_visibility`: Visibility setting for e-commerce

### Location Management
- `present_at_location_ids`: Locations where item is available
- `absent_at_location_ids`: Locations where item is not available
- `location_overrides`: Location-specific settings
