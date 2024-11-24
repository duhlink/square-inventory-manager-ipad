# Square Inventory Parameters

## CatalogItemVariation Object

### Inventory Tracking Fields
- `track_inventory`: Boolean - Whether inventory tracking is enabled
- `inventory_alert_type`: String - Type of inventory alert
  - `NONE` - No alert
  - `LOW_QUANTITY` - Alert when quantity is low
- `inventory_alert_threshold`: Long - Quantity threshold for low inventory alert

### Location Overrides
```json
"location_overrides": [
  {
    "location_id": "Location ID",
    "track_inventory": true/false,
    "sold_out": true/false
  }
]
```

## Inventory States
- `IN_STOCK` - Item is in stock
- `OUT_OF_STOCK` - Item is out of stock
- `WASTE` - Item was wasted/damaged
- `UNLINKED_RETURN` - Item was returned but not linked to original sale
- `SOLD` - Item was sold

## Inventory Counts
Tracked through CatalogItemVariation's track_inventory field:

```json
{
  "catalog_object_id": "Item variation ID",
  "state": "IN_STOCK",
  "location_id": "Location ID", 
  "quantity": "10",
  "calculated_at": "2024-01-24T06:42:44.266Z"
}
```

## Important Notes

1. Inventory tracking must be enabled per variation:
   - Set `track_inventory: true` on CatalogItemVariation
   - Can be overridden per location using location_overrides

2. Inventory is tracked at the variation level, not the item level

3. Inventory counts are maintained per:
   - Catalog item variation
   - Location
   - State (IN_STOCK, SOLD, etc)

4. Location-specific settings:
   - Can override tracking per location
   - Can mark items as sold out per location
   - Each location maintains its own counts

5. Best Practices:
   - Enable tracking only for items that need inventory management
   - Set appropriate alert thresholds for low stock warnings
   - Use location overrides for location-specific inventory policies
   - Initialize inventory counts after enabling tracking

## Example Usage

```json
// Enable inventory tracking on item variation
{
  "type": "ITEM_VARIATION",
  "id": "variation_id",
  "item_variation_data": {
    "track_inventory": true,
    "inventory_alert_type": "LOW_QUANTITY",
    "inventory_alert_threshold": 5,
    "location_overrides": [
      {
        "location_id": "location_id",
        "track_inventory": true
      }
    ]
  }
}

// Set initial inventory count
{
  "changes": [
    {
      "type": "PHYSICAL_COUNT",
      "physical_count": {
        "catalog_object_id": "variation_id",
        "location_id": "location_id", 
        "state": "IN_STOCK",
        "quantity": "10"
      }
    }
  ]
}
