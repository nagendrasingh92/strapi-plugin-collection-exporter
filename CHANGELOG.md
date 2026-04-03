# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.2.0] - 2026-04-03

### Added

- TimePicker for start and end time filtering (From Time / To Time)
- Date range validation with toast notifications using Strapi's useNotification
- Toast warning when selecting To Date without From Date
- Toast warning when From Date is after To Date or vice versa
- Search filters only apply on Search button click (no auto-fetch on date/time change)

### Changed

- Date labels renamed from "Start Date / End Date" to "From Date / To Date"
- Time labels use "From Time / To Time" naming
- Date picker placeholder updated to DD/MM/YYYY format with en-GB locale
- Removed console.log/error statements for clean production output

### Fixed

- Timezone offset: time picker values now correctly convert local time to UTC for API queries
- DatePicker prop changed from deprecated `selectedDate` to `value`
- Date state managed as strings to prevent Strapi DatePicker blur-clearing issues

## [1.1.0] - 2026-03-28

### Added

- i18n (internationalization) support — locale selector for collections with i18n enabled
- Drag and drop column reordering in the column picker
- Locale column included in exports for i18n collections
- Available locales auto-detected from Strapi i18n plugin

### Changed

- Improved modal layout — reduced padding, two-row toolbar with filters on row 1 and actions on row 2
- Added proper title "Collection Exporter — {collection name}" to the modal header
- Added visible labels for Search, Start Date, End Date, and Locale fields
- Buttons now have consistent 40px height matching input fields
- Moved Clear Filters next to Search button
- Column picker now shows "Displayed fields" (draggable) and "Hidden fields" sections separately
- Column picker popover z-index fixed to render above the modal
- Export buttons renamed to "Export CSV" and "Export Excel" for clarity
- Popover.Trigger uses asChild prop to fix column picker click handling

### Fixed

- CSV export now respects current filters and selected columns (was hardcoded before)
- Excel export generates native XLSX format (no more format mismatch warning)
- escapeXml and escapeCsvField now safely handle non-string values
- Download function works reliably inside modals
- Duplicate headers removed from export response
- Password hashes stripped from API responses

## [1.0.0] - 2026-03-28

### Added

- CSV export with UTF-8 BOM encoding and proper field escaping
- Excel (XLSX) export with native Office Open XML format
- Full data table modal with all collection columns
- Global search across text, richtext, email, and string fields
- Date range filtering with start and end date pickers
- Column picker to select which fields to display and export
- Configurable pagination (10, 25, 50, 100 entries per page)
- Column sorting (ascending/descending)
- Automatic column detection excluding sensitive fields
- Media URL resolution (single and multiple media)
- Relation field handling with ID extraction
- Batch export for large datasets (server-side batching in groups of 100)
- Admin authentication on all API endpoints
- Password field exclusion from data and exports
- System field exclusion (createdBy, updatedBy, localizations)
