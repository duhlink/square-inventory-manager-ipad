# Square Categories API Structure

## API Query Example
```bash
curl https://connect.squareup.com/v2/catalog/list?types=CATEGORY \
  -H 'Square-Version: 2024-11-20' \
  -H 'Authorization: Bearer EAAAl7jn6--qEQf4iuFDvdTLzYgWNwIxBRj5HkBIm_vGcZuAzkmq95dLi8W-QqaE' \
  -H 'Content-Type: application/json'
```

## Core Object Structure
- `objects`: Array of category objects
- `cursor`: Pagination cursor for fetching next set of results

## Category Object Structure

### Base Fields
- `type`: Always "CATEGORY"
- `id`: Unique identifier for the category
- `updated_at`: Last update timestamp
- `created_at`: Creation timestamp
- `version`: Version number
- `is_deleted`: Boolean indicating if category is deleted
- `present_at_all_locations`: Boolean for availability across locations

### Category Data (`category_data`)
- `name`: Category name
- `abbreviation`: Short form of category name
- `image_ids`: Array of associated image IDs
- `category_type`: Type of category (e.g., "REGULAR_CATEGORY")
- `is_top_level`: Boolean indicating if it's a top-level category
- `online_visibility`: Boolean for online visibility status

### Hierarchy Information
- `parent_category`: Parent category information
  - `id`: ID of parent category
  - `ordinal`: Ordering value
- `root_category`: ID of the topmost category in hierarchy

### Location Settings
- `location_overrides`: Location-specific settings
  - `location_id`: ID of the location
  - `ordinal`: Location-specific ordering value

### E-commerce SEO Data
- `ecom_seo_data`:
  - `page_title`: SEO title
  - `page_description`: SEO description
  - `permalink`: SEO URL

## Common Categories and Their Relationships

### Main Categories
- Small Tanks (ID: AXNGYK6KC64YSKIZW26IKXM2)
  - Parent: DTW3SVWQQF7PQ7IU4QJDLN3U
  - Used for smaller portable propane tanks

- ASME Tanks (ID: YFY2TRJIJ6QJK7V2UZH3SB5P)
  - Parent: DTW3SVWQQF7PQ7IU4QJDLN3U
  - Used for larger stationary tanks

### Category Matching
To filter catalog items by category:
1. Get category ID from the categories API
2. Match with `categories[].id` in catalog items
3. Use the category name from `category_data.name` for display

## Example Category Response
```json
{
  "type": "CATEGORY",
  "id": "AXNGYK6KC64YSKIZW26IKXM2",
  "category_data": {
    "name": "Small Tanks",
    "abbreviation": "Sm",
    "category_type": "REGULAR_CATEGORY",
    "parent_category": {
      "id": "DTW3SVWQQF7PQ7IU4QJDLN3U",
      "ordinal": -2251589360287744
    },
    "is_top_level": false,
    "online_visibility": false,
    "root_category": "DTW3SVWQQF7PQ7IU4QJDLN3U"
  }
}
```

## Integration Notes
- Categories can be hierarchical with parent-child relationships
- Each category has a unique ID used for filtering catalog items
- Category names should be used for display purposes while IDs for filtering
- The `ordinal` value determines the display order of categories
- Categories can have location-specific settings through `location_overrides`
