# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

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
