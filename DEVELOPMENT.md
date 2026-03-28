# Development & Publishing Guide

## Prerequisites

- Node.js >= 20.x
- npm >= 6.x
- A Strapi v5 test project

## Project Structure

```
strapi-plugin-collection-exporter/
├── admin/src/          # Frontend (React) source
│   ├── components/
│   │   ├── ColumnPicker.tsx
│   │   ├── DataModal.tsx
│   │   ├── Initializer.tsx
│   │   └── ViewDataButton.tsx
│   ├── index.tsx       # Plugin registration
│   └── pluginId.ts     # Plugin ID constant
├── server/src/         # Backend (Node.js) source
│   ├── controllers/
│   │   └── controller.ts
│   ├── routes/
│   │   ├── admin.ts
│   │   └── index.ts
│   ├── services/
│   │   └── service.ts
│   └── index.ts        # Server plugin entry
├── dist/               # Built output (gitignored)
├── strapi-admin.js     # CJS entry point for admin
├── strapi-server.js    # CJS entry point for server
├── package.json
├── tsconfig.json
├── CHANGELOG.md
├── LICENSE
└── README.md
```

## Local Development Setup

### 1. Install dependencies

```bash
cd strapi-plugin-collection-exporter
npm install
```

### 2. Build the plugin

```bash
npm run build
```

### 3. Link to a test Strapi project

```bash
# In the plugin directory
npx yalc publish

# In your Strapi test project directory
npx yalc add strapi-plugin-collection-exporter
npm install
```

### 4. Enable the plugin in the test project

Add to `config/plugins.ts`:

```typescript
export default {
  'collection-exporter': {
    enabled: true,
  },
};
```

### 5. Run the test project

```bash
npm run build
npm run develop
```

### 6. Watch mode (auto-rebuild on changes)

```bash
# In the plugin directory
npm run watch

# In a separate terminal, push changes to the test project
npx yalc push
```

After each push, rebuild the Strapi test project:

```bash
cd my-strapi-project
npm run build
npm run develop
```

## Making Changes

### 1. Edit source files

- Frontend changes: `admin/src/`
- Backend changes: `server/src/`

### 2. Build and test locally

```bash
# Build the plugin
npm run build

# Push to test project (if using yalc)
npx yalc push

# In the test project
cd ../my-strapi-project
npm run build
npm run develop
```

### 3. Verify the build

```bash
npm run verify
```

## Publishing a New Version

### 1. Update version number

```bash
# Patch: 1.0.0 → 1.0.1 (bug fixes)
npm version patch

# Minor: 1.0.0 → 1.1.0 (new features)
npm version minor

# Major: 1.0.0 → 2.0.0 (breaking changes)
npm version major
```

### 2. Update CHANGELOG.md

Add a new section at the top of CHANGELOG.md:

```markdown
## [1.0.1] - YYYY-MM-DD

### Fixed
- Description of bug fix

### Added
- Description of new feature
```

### 3. Build and verify

```bash
npm run build
npm run verify
```

### 4. Test with a fresh Strapi project

```bash
# Create a temporary test project
npx create-strapi-app@latest test-project --quickstart

# Install your plugin from local
cd test-project
npm install ../strapi-plugin-collection-exporter

# Enable in config/plugins.ts, then:
npm run build
npm run develop
```

### 5. Publish to npm

```bash
npm publish --otp=YOUR_6_DIGIT_CODE
```

### 6. Push to GitHub

```bash
git add .
git commit -m "Release v1.0.1 — description of changes"
git push origin main
```

### 7. Create a GitHub release (optional)

```bash
gh release create v1.0.1 --title "v1.0.1" --notes "Description of changes"
```

## Testing Checklist

Before every release, verify:

- [ ] Plugin builds without errors (`npm run build`)
- [ ] Plugin verifies without errors (`npm run verify`)
- [ ] Button appears on collection type list views
- [ ] Modal opens and displays data correctly
- [ ] Search filters data across text fields
- [ ] Date range filters work
- [ ] Column picker opens and toggles columns
- [ ] Column sorting works (ascending/descending)
- [ ] Pagination works (page navigation, page size selector)
- [ ] CSV export downloads a valid file
- [ ] Excel export downloads a valid .xlsx file
- [ ] Exported files contain correct data matching current filters
- [ ] Exported files respect selected columns
- [ ] Password fields are excluded from data
- [ ] System fields (createdBy, updatedBy) are excluded
- [ ] Media fields show full URLs in exports
- [ ] Relation fields show IDs in exports
- [ ] Works with empty collections (no errors)
- [ ] Works with large collections (100+ entries)
