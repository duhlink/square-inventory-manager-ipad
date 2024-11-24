# Square Catalog Item Parameters

## CatalogItem Object

### Required Parameters
- `type`: String - Must be "ITEM"

### Optional Parameters
- `id`: String - Unique ID for this catalog item
- `updated_at`: DateTime - Last modification timestamp
- `version`: Integer - Version number
- `is_deleted`: Boolean - If the object is deleted
- `custom_attribute_values`: Map<String, CatalogCustomAttributeValue>
- `catalog_v1_ids`: Array of CatalogV1Id objects
- `present_at_all_locations`: Boolean
- `present_at_location_ids`: Array of String location IDs
- `absent_at_location_ids`: Array of String location IDs
- `item_data`: CatalogItemData object containing:
  - `name`: String - Item name
  - `description`: String
  - `abbreviation`: String
  - `label_color`: String - Color of the label
  - `available_online`: Boolean
  - `available_for_pickup`: Boolean
  - `available_electronically`: Boolean
  - `category_id`: String - ID of category
  - `tax_ids`: Array of String tax IDs
  - `modifier_list_info`: Array of CatalogItemModifierListInfo
  - `variations`: Array of CatalogObject (ITEM_VARIATION)
  - `product_type`: String (REGULAR, GIFT_CARD, APPOINTMENTS_SERVICE)
  - `skip_modifier_screen`: Boolean
  - `item_options`: Array of CatalogItemOptionForItem
  - `image_ids`: Array of String image IDs
  - `sort_name`: String - Alternative name for sorting
  - `description_html`: String - HTML formatted description
  - `description_plaintext`: String - Plain text description

## CatalogItemVariation Object

### Required Parameters
- `type`: String - Must be "ITEM_VARIATION"
- `item_variation_data`: Object containing:
  - `item_id`: String - ID of parent item
  - `name`: String - Name of variation
  - `pricing_type`: String (FIXED_PRICING, VARIABLE_PRICING)

### Optional Parameters in item_variation_data
- `sku`: String
- `ordinal`: Integer
- `pricing_type`: String
- `price_money`: Money object
- `location_overrides`: Array of ItemVariationLocationOverrides
- `track_inventory`: Boolean
- `inventory_alert_type`: String (NONE, LOW_QUANTITY, NONE)
- `inventory_alert_threshold`: Long
- `user_data`: String
- `service_duration`: Long
- `available_for_booking`: Boolean
- `item_option_values`: Array of CatalogItemOptionValueForItemVariation
- `measurement_unit_id`: String
- `sellable`: Boolean
- `stockable`: Boolean
- `image_ids`: Array of String image IDs
- `team_member_ids`: Array of String team member IDs
- `stockable_conversion`: CatalogStockConversion object

## Example JSON Structure
```json
{
  "type": "ITEM",
  "id": "ITEM_ID",
  "item_data": {
    "name": "Item Name",
    "description": "Item Description",
    "variations": [
      {
        "type": "ITEM_VARIATION",
        "id": "VARIATION_ID",
        "item_variation_data": {
          "item_id": "ITEM_ID",
          "name": "Regular",
          "sku": "SKU123",
          "pricing_type": "FIXED_PRICING",
          "price_money": {
            "amount": 1000,
            "currency": "USD"
          },
          "track_inventory": true
        }
      }
    ]
  }
}
```

## Important Notes

1. When creating items:
   - Each item must have at least one variation
   - Variations must have pricing information
   - SKUs must be unique across all variations

2. For inventory tracking:
   - Set `track_inventory: true` on variations
   - Use `inventory_alert_type` and `inventory_alert_threshold` for alerts
   - Initial inventory counts must be set via Inventory API

3. Location availability:
   - Use `present_at_all_locations` for global items
   - Or specify `present_at_location_ids`/`absent_at_location_ids`

4. Pricing:
   - Amounts are in smallest currency unit (cents for USD)
   - Support both fixed and variable pricing
   - Can override pricing by location
