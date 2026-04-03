# Strapi Plugin - Collection Exporter

Export your Strapi collection data to **CSV** and **Excel (XLSX)** with advanced filtering, search, column selection, and pagination — directly from the admin panel.

## Features

- **CSV/Excel Button** — Adds a "CSV/Excel" button to every collection type list view
- **Export to CSV** — Download filtered data as a CSV file with proper encoding (UTF-8 BOM)
- **Export to Excel** — Download filtered data as a native XLSX file (no warning dialogs)
- **Full Data Table** — View all entries in a responsive modal with all columns
- **Global Search** — Search across all text fields (string, text, richtext, email)
- **Date & Time Range Filters** — Filter entries by date and time with From/To pickers and validation
- **Column Selection** — Choose which columns to display and export using the column picker
- **Pagination** — Navigate through large datasets with configurable page sizes (10, 25, 50, 100)
- **Column Sorting** — Click any column header to sort ascending or descending
- **Auto Column Detection** — Automatically detects and displays all non-sensitive fields
- **Media URL Resolution** — Media fields are exported as full URLs
- **Relation Handling** — Relation fields are exported with their IDs
- **Batch Export** — Exports all data (not just the current page) with server-side batching

## Requirements

- Strapi v5.x
- Node.js >= 20.x

## Installation

```bash
npm install strapi-plugin-collection-exporter
```

Or with yarn:

```bash
yarn add strapi-plugin-collection-exporter
```

## Configuration

Add the plugin to your Strapi configuration in `config/plugins.ts` (or `config/plugins.js`):

```typescript
export default {
  'collection-exporter': {
    enabled: true,
  },
};
```

Then rebuild your admin panel:

```bash
npm run build
npm run develop
```

## Usage

1. Navigate to any **Collection Type** in the Content Manager
2. Click the **"CSV/Excel"** button in the list view actions area
3. A modal opens displaying all entries with all columns
4. Use the **search bar** to filter across all text fields
5. Use **From Date/Time** and **To Date/Time** pickers to filter by date range
6. Click column headers to **sort** data
7. Use the **Columns** button to select which columns to display and export
8. Use the **page size selector** to control how many entries are shown per page
9. Click **CSV** or **Excel** to download the data with your current filters and column selection applied
10. Navigate pages using the **pagination controls** at the bottom

## How It Works

The plugin adds a button to the Content Manager list view using Strapi's injection zone system. When clicked, it opens a full-screen modal that:

1. Fetches the collection schema to determine available columns
2. Queries the data through a secure admin API endpoint
3. Renders results in a paginated, sortable data table
4. Applies server-side filtering for search and date ranges
5. Exports all matching data (not just the current page) via a dedicated export endpoint

All API endpoints are protected by admin authentication policies.

## Security

- All endpoints require admin authentication (`admin::isAuthenticatedAdmin`)
- Password fields are automatically excluded from results and exports
- System fields (`createdBy`, `updatedBy`, `localizations`) are excluded to prevent sensitive data leakage
- Dynamic zone and component fields are excluded for clarity
- No sensitive data is exposed through the plugin API
- No external requests or data collection

## Troubleshooting

**Plugin not showing up?**
Make sure you've added it to `config/plugins.ts` and rebuilt the admin panel with `npm run build`.

**Button not visible on a collection?**
The button only appears on collection type list views, not single types.

**Export includes unexpected columns?**
Use the Columns picker to select only the fields you need before exporting.

## Reporting Issues

Please report any issues or feature requests on the [GitHub Issues](https://github.com/nagendrasingh92/strapi-plugin-collection-exporter/issues) page.

## Contributing

Contributions are welcome. Please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](./LICENSE) file for details.

## Author

**Nagendra Singh Chauhan** — [GitHub](https://github.com/nagendrasingh92)
