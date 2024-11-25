# Square Catalog API Structure

## Overview
This document outlines the structure of data returned from the Square Catalog API, specifically for catalog items.

## Item Structure

```typescript
{
  id: string              // Square catalog item ID
  name: string           // Item name
  description: string    // Item description
  sku: string           // Primary SKU from first variation
  categories: string[]   // Array of category names
  price: number         // Price in dollars (converted from cents)
  unitCost: number      // Cost in dollars (calculated)
  quantity: number      // Total quantity across variations
  reorderPoint: number  // Point at which to reorder (configurable)
  vendorName: string    // Vendor name if available
  vendorCode: string    // Vendor ID/code if available
  status: string        // Inventory status (out_of_stock, low_stock, in_stock)
  unitType: string      // Measurement unit or 'per item'
  lastUpdated: string   // Last update timestamp
  updatedBy: string     // Who made the last update
  squareId: string      // Original Square ID
  squareCatalogVersion: number // Square catalog version
  squareUpdatedAt: string // Square last update timestamp
  variations: Variation[] // Array of variations
}
```

## Variation Structure

```typescript
{
  id: string           // Variation ID
  name: string        // Variation name
  sku: string        // Variation SKU
  price: number      // Price in dollars
  cost: number       // Cost in dollars
  quantity: number   // Current quantity
  upc: string       // UPC code if available
  measurementUnit: string // Measurement unit ID
}
```

## Status Types
- `out_of_stock`: Quantity is 0
- `low_stock`: Quantity is at or below reorder point
- `in_stock`: Quantity is above reorder point

## Categories
Categories are extracted from the Square API's relatedObjects. Each item can belong to multiple categories.

## Vendor Information
Vendor information is currently defaulted to:
- vendorName: "No Vendor"
- vendorCode: "No Code"

## Important Notes

1. **Price Conversion**: Square stores prices in cents, our API converts to dollars
2. **Inventory**: Currently set to 0, needs integration with Square Inventory API
3. **Categories**: Pulled from related objects in the Square response
4. **Caching**: Responses are cached for 1 minute to improve performance
5. **Updates**: Cache is cleared on any updates to ensure fresh data

## API Endpoints

### GET /api/square/catalog
Returns a list of all catalog items with the above structure.

### PUT /api/square/catalog
Updates a catalog item. Required fields:
- id
- name
- price
- sku (optional)
- description (optional)
- categories (optional)

## Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": "ITEM_ID",
      "name": "Example Item",
      "description": "Example description",
      "sku": "SKU123",
      "categories": ["Category 1", "Category 2"],
      "price": 19.99,
      "unitCost": 10.00,
      "quantity": 5,
      "reorderPoint": 5,
      "vendorName": "No Vendor",
      "vendorCode": "No Code",
      "status": "in_stock",
      "unitType": "per item",
      "lastUpdated": "2024-01-01T00:00:00Z",
      "updatedBy": "system",
      "squareId": "SQUARE_ID",
      "squareCatalogVersion": 1,
      "squareUpdatedAt": "2024-01-01T00:00:00Z",
      "variations": [
        {
          "id": "VAR_ID",
          "name": "Regular",
          "sku": "SKU123",
          "price": 19.99,
          "cost": 10.00,
          "quantity": 5,
          "upc": "",
          "measurementUnit": "per item"
        }
      ]
    }
  ]
}
