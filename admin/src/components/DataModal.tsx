import { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  Button,
  TextInput,
  DatePicker,
  TimePicker,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Typography,
  Flex,
  Box,
  Badge,
  Loader,
  IconButton,
  SingleSelect,
  SingleSelectOption,
} from '@strapi/design-system';
import { ArrowLeft, ArrowRight, Search, Download } from '@strapi/icons';
import { useFetchClient, useNotification } from '@strapi/strapi/admin';
import { PLUGIN_ID } from '../pluginId';
import { ColumnPicker } from './ColumnPicker';

interface DataModalProps {
  uid: string;
  onClose: () => void;
}

interface ColumnInfo {
  type: string;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

const MEDIA_TYPES = ['media'];
const RELATION_TYPES = ['relation'];

const DataModal = ({ uid, onClose }: DataModalProps) => {
  const { get } = useFetchClient();
  const { toggleNotification } = useNotification();

  const [data, setData] = useState<any[]>([]);
  const [attributes, setAttributes] = useState<Record<string, ColumnInfo>>({});
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    pageCount: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedStartTime, setAppliedStartTime] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');
  const [appliedEndTime, setAppliedEndTime] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pageSize, setPageSize] = useState('10');
  const [searchInput, setSearchInput] = useState('');
  const [exporting, setExporting] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [allColumns, setAllColumns] = useState<string[]>([]);
  const [isLocalized, setIsLocalized] = useState(false);
  const [availableLocales, setAvailableLocales] = useState<string[]>([]);
  const [locale, setLocale] = useState<string>('');

  // --- Helpers ---

  const buildISODate = (date: string, time: string, isEnd: boolean): string | undefined => {
    if (!date) return undefined;
    const [year, month, day] = date.split('-').map(Number);
    if (time) {
      const [hours, minutes] = time.split(':').map(Number);
      return new Date(year, month - 1, day, hours, minutes, 0).toISOString();
    }
    return isEnd
      ? new Date(year, month - 1, day, 23, 59, 59, 999).toISOString()
      : new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
  };

  const getDateRangeError = (): string => {
    if (startTime && !startDate) return 'Please select From Date when From Time is set';
    if (endTime && !endDate) return 'Please select To Date when To Time is set';
    if (endDate && !startDate) return 'Please select From Date first';
    if (startDate && endDate) {
      const start = buildISODate(startDate, startTime, false)!;
      const end = buildISODate(endDate, endTime, true)!;
      if (start > end) return 'To Date/Time must be after From Date/Time';
    }
    return '';
  };

  const getBaseUrl = (): string => {
    return (window as any).strapi?.backendURL || '';
  };

  const extractMediaUrl = (value: any): string => {
    if (!value) return '';
    const baseUrl = getBaseUrl();
    // Single media
    if (value.url) {
      const url = value.url as string;
      return url.startsWith('http') ? url : `${baseUrl}${url}`;
    }
    // Multiple media - return comma-separated URLs
    if (Array.isArray(value)) {
      return value
        .map((item: any) => {
          if (!item?.url) return '';
          const url = item.url as string;
          return url.startsWith('http') ? url : `${baseUrl}${url}`;
        })
        .filter(Boolean)
        .join(', ');
    }
    return '';
  };

  const extractRelationValue = (value: any): string => {
    if (!value) return '';
    if (Array.isArray(value)) {
      return value.map((item: any) => item?.id || item?.documentId || '').filter(Boolean).join(', ');
    }
    return value?.id || value?.documentId || String(value);
  };

  const isISODate = (value: any): boolean => {
    if (typeof value !== 'string') return false;
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
  };

  const formatLocalDate = (value: string): string => {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const resolveFieldValue = (value: any, fieldType?: string): string => {
    if (value === null || value === undefined) return '';
    if (fieldType && MEDIA_TYPES.includes(fieldType)) return extractMediaUrl(value);
    if (fieldType && RELATION_TYPES.includes(fieldType)) return extractRelationValue(value);
    if (isISODate(value)) return formatLocalDate(value);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const getColumnType = (key: string): string => {
    if (key === 'createdAt' || key === 'updatedAt' || key === 'publishedAt') return 'datetime';
    return attributes[key]?.type || 'string';
  };

  // --- Download helpers ---

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const escapeCsvField = (val: unknown): string => {
    const str = val === null || val === undefined ? '' : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const buildCsv = (rows: any[], headers: string[], attrMap: Record<string, ColumnInfo>): string => {
    const csvRows = [headers.map((h) => escapeCsvField(h)).join(',')];
    for (const row of rows) {
      csvRows.push(
        headers
          .map((h) => escapeCsvField(resolveFieldValue(row[h], attrMap[h]?.type || getColumnType(h))))
          .join(',')
      );
    }
    return '\uFEFF' + csvRows.join('\r\n');
  };

  // --- Export params ---

  const buildExportParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set('uid', uid);
    if (search) params.set('search', search);
    const startISO = buildISODate(appliedStartDate, appliedStartTime, false);
    const endISO = buildISODate(appliedEndDate, appliedEndTime, true);
    if (startISO) params.set('startDate', startISO);
    if (endISO) params.set('endDate', endISO);
    if (sortBy) params.set('sortBy', sortBy);
    if (sortOrder) params.set('sortOrder', sortOrder);
    if (locale) params.set('locale', locale);
    return params;
  }, [uid, search, appliedStartDate, appliedStartTime, appliedEndDate, appliedEndTime, sortBy, sortOrder, locale]);

  const fetchExportData = async () => {
    const response = await get(`/${PLUGIN_ID}/export?${buildExportParams().toString()}`);
    return response.data as {
      data: any[];
      headers: string[];
      attributes: Record<string, ColumnInfo>;
      total: number;
    };
  };

  // --- Export handlers ---

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const result = await fetchExportData();
      const { data: rows, attributes: exportAttrs } = result;
      if (!rows || rows.length === 0) return;
      const exportHeaders = selectedColumns.length > 0 ? selectedColumns : result.headers;
      const csv = buildCsv(rows, exportHeaders, exportAttrs);
      const name = uid.split('.').pop() || 'export';
      downloadFile(csv, `${name}_export.csv`, 'text/csv;charset=utf-8;');
    } catch (error) {
      // silent
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const result = await fetchExportData();
      const { data: rows, attributes: exportAttrs } = result;
      if (!rows || rows.length === 0) return;
      const exportHeaders = selectedColumns.length > 0 ? selectedColumns : result.headers;
      const name = uid.split('.').pop() || 'export';

      const escapeXml = (val: unknown): string => {
        const str = val === null || val === undefined ? '' : String(val);
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      };

      // Column letter helper (A, B, ... Z, AA, AB, ...)
      const colLetter = (i: number): string => {
        let s = '';
        let n = i;
        while (n >= 0) {
          s = String.fromCharCode(65 + (n % 26)) + s;
          n = Math.floor(n / 26) - 1;
        }
        return s;
      };

      // Build sheet XML
      let sheetData = '';
      // Header row
      sheetData += '<row r="1">';
      exportHeaders.forEach((h, ci) => {
        sheetData += `<c r="${colLetter(ci)}1" t="inlineStr"><is><t>${escapeXml(h)}</t></is></c>`;
      });
      sheetData += '</row>';
      // Data rows
      rows.forEach((row: any, ri: number) => {
        const rowNum = ri + 2;
        sheetData += `<row r="${rowNum}">`;
        exportHeaders.forEach((h, ci) => {
          const resolved = resolveFieldValue(row[h], exportAttrs[h]?.type || getColumnType(h));
          const ref = `${colLetter(ci)}${rowNum}`;
          if (typeof row[h] === 'number') {
            sheetData += `<c r="${ref}"><v>${row[h]}</v></c>`;
          } else {
            sheetData += `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(resolved)}</t></is></c>`;
          }
        });
        sheetData += '</row>';
      });

      const lastCol = colLetter(exportHeaders.length - 1);
      const lastRow = rows.length + 1;

      const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<dimension ref="A1:${lastCol}${lastRow}"/>
<sheetData>${sheetData}</sheetData>
</worksheet>`;

      const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${escapeXml(name)}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;

      const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`;

      const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;

      const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

      // Build ZIP using minimal ZIP format (store method, no compression)
      const encoder = new TextEncoder();
      const files: Array<{ path: string; data: Uint8Array }> = [
        { path: '[Content_Types].xml', data: encoder.encode(contentTypesXml) },
        { path: '_rels/.rels', data: encoder.encode(relsXml) },
        { path: 'xl/workbook.xml', data: encoder.encode(workbookXml) },
        { path: 'xl/_rels/workbook.xml.rels', data: encoder.encode(workbookRelsXml) },
        { path: 'xl/worksheets/sheet1.xml', data: encoder.encode(sheetXml) },
      ];

      // CRC32 lookup table
      const crcTable: number[] = [];
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
          c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
        }
        crcTable[n] = c;
      }
      const crc32 = (data: Uint8Array): number => {
        let crc = 0xFFFFFFFF;
        for (let i = 0; i < data.length; i++) {
          crc = crcTable[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
        }
        return (crc ^ 0xFFFFFFFF) >>> 0;
      };

      // Build ZIP binary
      const parts: Uint8Array[] = [];
      const centralDir: Uint8Array[] = [];
      let offset = 0;

      for (const file of files) {
        const pathBytes = encoder.encode(file.path);
        const crc = crc32(file.data);

        // Local file header
        const localHeader = new ArrayBuffer(30 + pathBytes.length);
        const lv = new DataView(localHeader);
        lv.setUint32(0, 0x04034B50, true);  // signature
        lv.setUint16(4, 20, true);           // version needed
        lv.setUint16(6, 0, true);            // flags
        lv.setUint16(8, 0, true);            // compression (store)
        lv.setUint16(10, 0, true);           // mod time
        lv.setUint16(12, 0, true);           // mod date
        lv.setUint32(14, crc, true);         // crc32
        lv.setUint32(18, file.data.length, true); // compressed size
        lv.setUint32(22, file.data.length, true); // uncompressed size
        lv.setUint16(26, pathBytes.length, true);  // filename length
        lv.setUint16(28, 0, true);           // extra field length
        new Uint8Array(localHeader).set(pathBytes, 30);

        const localHeaderArr = new Uint8Array(localHeader);
        parts.push(localHeaderArr);
        parts.push(file.data);

        // Central directory entry
        const cdEntry = new ArrayBuffer(46 + pathBytes.length);
        const cv = new DataView(cdEntry);
        cv.setUint32(0, 0x02014B50, true);  // signature
        cv.setUint16(4, 20, true);           // version made by
        cv.setUint16(6, 20, true);           // version needed
        cv.setUint16(8, 0, true);            // flags
        cv.setUint16(10, 0, true);           // compression
        cv.setUint16(12, 0, true);           // mod time
        cv.setUint16(14, 0, true);           // mod date
        cv.setUint32(16, crc, true);         // crc32
        cv.setUint32(20, file.data.length, true); // compressed size
        cv.setUint32(24, file.data.length, true); // uncompressed size
        cv.setUint16(28, pathBytes.length, true);  // filename length
        cv.setUint16(30, 0, true);           // extra length
        cv.setUint16(32, 0, true);           // comment length
        cv.setUint16(34, 0, true);           // disk number
        cv.setUint16(36, 0, true);           // internal attrs
        cv.setUint32(38, 0, true);           // external attrs
        cv.setUint32(42, offset, true);      // local header offset
        new Uint8Array(cdEntry).set(pathBytes, 46);

        centralDir.push(new Uint8Array(cdEntry));
        offset += localHeaderArr.length + file.data.length;
      }

      const cdOffset = offset;
      let cdSize = 0;
      for (const cd of centralDir) {
        parts.push(cd);
        cdSize += cd.length;
      }

      // End of central directory
      const eocd = new ArrayBuffer(22);
      const ev = new DataView(eocd);
      ev.setUint32(0, 0x06054B50, true);     // signature
      ev.setUint16(4, 0, true);              // disk number
      ev.setUint16(6, 0, true);              // cd start disk
      ev.setUint16(8, files.length, true);   // cd entries on disk
      ev.setUint16(10, files.length, true);  // total cd entries
      ev.setUint32(12, cdSize, true);        // cd size
      ev.setUint32(16, cdOffset, true);      // cd offset
      ev.setUint16(20, 0, true);             // comment length
      parts.push(new Uint8Array(eocd));

      // Combine all parts
      const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
      const zipData = new Uint8Array(totalLength);
      let pos = 0;
      for (const part of parts) {
        zipData.set(part, pos);
        pos += part.length;
      }

      const blob = new Blob([zipData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${name}_export.xlsx`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch (error) {
      // silent
    } finally {
      setExporting(false);
    }
  };

  // --- Data fetching ---

  const fetchData = useCallback(
    async (page: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('uid', uid);
        params.set('page', String(page));
        params.set('pageSize', pageSize);
        if (search) params.set('search', search);
        const startISO = buildISODate(appliedStartDate, appliedStartTime, false);
        const endISO = buildISODate(appliedEndDate, appliedEndTime, true);
        if (startISO) params.set('startDate', startISO);
        if (endISO) params.set('endDate', endISO);
        if (sortBy) params.set('sortBy', sortBy);
        if (sortOrder) params.set('sortOrder', sortOrder);
        if (locale) params.set('locale', locale);

        const response = await get(`/${PLUGIN_ID}/collection?${params.toString()}`);

        const respData = response.data;
        setData(respData.data || []);
        setMeta(respData.meta || { page: 1, pageSize: 10, pageCount: 0, total: 0 });

        // Handle i18n info
        if (respData.isLocalized !== undefined) {
          setIsLocalized(respData.isLocalized);
        }
        if (respData.availableLocales) {
          setAvailableLocales(respData.availableLocales);
          // Auto-select first locale if none selected
          if (!locale && respData.availableLocales.length > 0) {
            setLocale(respData.availableLocales[0]);
          }
        }

        if (respData.attributes) {
          setAttributes(respData.attributes);
          const cols = [
            'documentId',
            ...Object.keys(respData.attributes),
            'createdAt',
            'updatedAt',
          ];
          if (respData.isLocalized) {
            cols.push('locale');
          }
          const uniqueCols = cols.filter((col, i, arr) => arr.indexOf(col) === i);
          setAllColumns(uniqueCols);
          if (selectedColumns.length === 0) {
            setSelectedColumns(uniqueCols);
          }
        }
      } catch (error) {
        // silent
        setData([]);
      } finally {
        setLoading(false);
      }
    },
    [get, uid, search, appliedStartDate, appliedStartTime, appliedEndDate, appliedEndTime, sortBy, sortOrder, pageSize, locale]
  );

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  // --- UI handlers ---

  const handleSearch = () => {
    const error = getDateRangeError();
    if (error) {
      toggleNotification({ type: 'warning', message: error });
      return;
    }
    setAppliedStartDate(startDate);
    setAppliedStartTime(startTime);
    setAppliedEndDate(endDate);
    setAppliedEndTime(endTime);
    setSearch(searchInput);
  };
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClearFilters = () => {
    setSearch('');
    setSearchInput('');
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
    setAppliedStartDate('');
    setAppliedStartTime('');
    setAppliedEndDate('');
    setAppliedEndTime('');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handlePageChange = (newPage: number) => fetchData(newPage);

  const formatCellValue = (value: any, type?: string): string => {
    if (value === null || value === undefined) return '-';
    if (type && MEDIA_TYPES.includes(type)) {
      const url = extractMediaUrl(value);
      return url || '-';
    }
    if (type && RELATION_TYPES.includes(type)) return extractRelationValue(value) || '-';
    if (type === 'datetime' || type === 'date' || isISODate(value)) return formatLocalDate(value);
    if (type === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    const str = String(value);
    return str.length > 80 ? str.substring(0, 80) + '...' : str;
  };

  const displayName = uid.split('.').pop() || uid;
  
  const visibleColumns = selectedColumns.length > 0 ? selectedColumns : allColumns;

  return (
    <Modal.Root open onOpenChange={onClose}>
      <Modal.Content
        style={{
          width: '95vw',
          maxWidth: '95vw',
          height: '90vh',
          maxHeight: '90vh',
        }}
      >
        <Modal.Header>
          <Flex justifyContent="space-between" width="100%">
            <Flex gap={3} alignItems="center">
              <Modal.Title>
                <Typography variant="alpha" fontWeight="bold">
                  Collection Exporter — {displayName}
                </Typography>
              </Modal.Title>
              <Badge>{meta.total} entries</Badge>
            </Flex>
          </Flex>
        </Modal.Header>
        <Modal.Body style={{ padding: '8px 16px' }}>
          <Box paddingBottom={2}>
            {/* Row 1: Filters + Search button */}
            <Flex gap={2} wrap="wrap" alignItems="flex-end" paddingBottom={2}>
              <Box style={{ flex: '1', minWidth: '200px' }}>
                <Typography variant="pi" fontWeight="bold" textColor="neutral800" style={{ display: 'block', marginBottom: '4px' }}>
                  Search
                </Typography>
                <TextInput
                  placeholder="Search across all fields..."
                  value={searchInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchInput(e.target.value)
                  }
                  onKeyDown={handleSearchKeyDown}
                  startAction={<Search />}
                  aria-label="Search"
                />
              </Box>
              <Box style={{ minWidth: '160px' }}>
                <Typography variant="pi" fontWeight="bold" textColor="neutral800" style={{ display: 'block', marginBottom: '4px' }}>
                  From Date
                </Typography>
                <DatePicker
                  onChange={(date: Date | undefined) => {
                    if (date) {
                      const y = date.getFullYear();
                      const m = String(date.getMonth() + 1).padStart(2, '0');
                      const d = String(date.getDate()).padStart(2, '0');
                      const dateStr = `${y}-${m}-${d}`;
                      if (endDate && dateStr > endDate) {
                        toggleNotification({ type: 'warning', message: 'From Date cannot be after To Date' });
                        return;
                      }
                      setStartDate(dateStr);
                    }
                  }}
                  onClear={() => {
                    setStartDate('');
                    setStartTime('');
                  }}
                  value={startDate ? new Date(startDate + 'T12:00:00') : undefined}
                  locale="en-GB"
                  placeholder="DD/MM/YYYY"
                  label="From Date"
                />
              </Box>
              <Box style={{ minWidth: '120px' }}>
                <Typography variant="pi" fontWeight="bold" textColor="neutral800" style={{ display: 'block', marginBottom: '4px' }}>
                  From Time
                </Typography>
                <TimePicker
                  onChange={(time: string) => setStartTime(time)}
                  value={startTime || undefined}
                  label="From Time"
                />
              </Box>
              <Box style={{ minWidth: '160px' }}>
                <Typography variant="pi" fontWeight="bold" textColor="neutral800" style={{ display: 'block', marginBottom: '4px' }}>
                  To Date
                </Typography>
                <DatePicker
                  onChange={(date: Date | undefined) => {
                    if (date) {
                      if (!startDate) {
                        toggleNotification({ type: 'warning', message: 'Please select From Date first' });
                        return;
                      }
                      const y = date.getFullYear();
                      const m = String(date.getMonth() + 1).padStart(2, '0');
                      const d = String(date.getDate()).padStart(2, '0');
                      const dateStr = `${y}-${m}-${d}`;
                      if (dateStr < startDate) {
                        toggleNotification({ type: 'warning', message: 'To Date cannot be before From Date' });
                        return;
                      }
                      setEndDate(dateStr);
                    }
                  }}
                  onClear={() => {
                    setEndDate('');
                    setEndTime('');
                  }}
                  value={endDate ? new Date(endDate + 'T12:00:00') : undefined}
                  locale="en-GB"
                  placeholder="DD/MM/YYYY"
                  label="To Date"
                />
              </Box>
              <Box style={{ minWidth: '120px' }}>
                <Typography variant="pi" fontWeight="bold" textColor="neutral800" style={{ display: 'block', marginBottom: '4px' }}>
                  To Time
                </Typography>
                <TimePicker
                  onChange={(time: string) => setEndTime(time)}
                  value={endTime || undefined}
                  label="To Time"
                />
              </Box>
              {isLocalized && availableLocales.length > 0 && (
                <Box style={{ minWidth: '120px' }}>
                  <SingleSelect
                    value={locale}
                    onChange={(value: string) => setLocale(value)}
                    label="Locale"
                  >
                    {availableLocales.map((loc) => (
                      <SingleSelectOption key={loc} value={loc}>
                        {loc}
                      </SingleSelectOption>
                    ))}
                  </SingleSelect>
                </Box>
              )}
              <Box style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                <Typography variant="pi" fontWeight="bold" textColor="transparent" style={{ display: 'block', marginBottom: '4px' }}>
                  &nbsp;
                </Typography>
                <Button onClick={handleSearch} variant="secondary" style={{ height: '40px' }}>
                  Search
                </Button>
                <Button onClick={handleClearFilters} variant="tertiary" style={{ height: '40px' }}>
                  Clear Filters
                </Button>
              </Box>
            </Flex>
            {/* Row 2: Actions */}
            <Flex gap={2} wrap="wrap" alignItems="flex-end">
              <Box style={{ minWidth: '100px' }}>
                <SingleSelect
                  value={pageSize}
                  onChange={(value: string) => setPageSize(value)}
                  label="Per page"
                >
                  <SingleSelectOption value="10">10</SingleSelectOption>
                  <SingleSelectOption value="25">25</SingleSelectOption>
                  <SingleSelectOption value="50">50</SingleSelectOption>
                  <SingleSelectOption value="100">100</SingleSelectOption>
                </SingleSelect>
              </Box>
              {allColumns.length > 0 && (
                <ColumnPicker
                  allColumns={allColumns}
                  selectedColumns={selectedColumns}
                  onChange={setSelectedColumns}
                />
              )}
              <Button
                onClick={handleExportCSV}
                variant="secondary"
                startIcon={<Download />}
                disabled={exporting || meta.total === 0}
                style={{ height: '40px' }}
              >
                {exporting ? 'Exporting...' : 'Export CSV'}
              </Button>
              <Button
                onClick={handleExportExcel}
                variant="secondary"
                startIcon={<Download />}
                disabled={exporting || meta.total === 0}
                style={{ height: '40px' }}
              >
                {exporting ? 'Exporting...' : 'Export Excel'}
              </Button>
            </Flex>
          </Box>

          {loading ? (
            <Flex justifyContent="center" padding={4}>
              <Loader />
            </Flex>
          ) : data.length === 0 ? (
            <Flex justifyContent="center" padding={4}>
              <Typography variant="omega" textColor="neutral600">
                No entries found
              </Typography>
            </Flex>
          ) : (
            <Box style={{ overflow: 'auto', maxHeight: 'calc(90vh - 240px)' }}>
              <Table>
                <Thead>
                  <Tr>
                    <Th>
                      <Typography variant="sigma">#</Typography>
                    </Th>
                    {visibleColumns.map((col, colIndex) => (
                      <Th
                        key={`${col}-${colIndex}`}
                        action={
                          <IconButton
                            label={`Sort by ${col}`}
                            onClick={() => handleSort(col)}
                            variant="ghost"
                          >
                            {sortBy === col ? (
                              <Typography variant="pi">
                                {sortOrder === 'asc' ? '↑' : '↓'}
                              </Typography>
                            ) : (
                              <Typography variant="pi" textColor="neutral400">
                                ↕
                              </Typography>
                            )}
                          </IconButton>
                        }
                      >
                        <Typography variant="sigma">
                          {col === 'documentId' ? 'ID' : col}
                        </Typography>
                      </Th>
                    ))}
                  </Tr>
                </Thead>
                <Tbody>
                  {data.map((entry, index) => (
                    <Tr key={entry.documentId || index}>
                      <Td>
                        <Typography variant="omega" textColor="neutral600">
                          {(meta.page - 1) * Number(pageSize) + index + 1}
                        </Typography>
                      </Td>
                      {visibleColumns.map((col, colIndex) => (
                        <Td key={`${col}-${colIndex}`}>
                          <Typography variant="omega" style={{ whiteSpace: 'nowrap' }}>
                            {formatCellValue(entry[col], getColumnType(col))}
                          </Typography>
                        </Td>
                      ))}
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}

          {meta.pageCount > 1 && (
            <Box paddingTop={2}>
              <Flex justifyContent="space-between" alignItems="center">
                <Typography variant="pi" textColor="neutral600">
                  Showing {(meta.page - 1) * Number(pageSize) + 1} to{' '}
                  {Math.min(meta.page * Number(pageSize), meta.total)} of {meta.total} entries
                </Typography>
                <Flex gap={2} alignItems="center">
                  <IconButton
                    label="Previous page"
                    onClick={() => handlePageChange(meta.page - 1)}
                    disabled={meta.page <= 1}
                  >
                    <ArrowLeft />
                  </IconButton>
                  {Array.from({ length: Math.min(meta.pageCount, 7) }, (_, i) => {
                    let pageNum: number;
                    if (meta.pageCount <= 7) {
                      pageNum = i + 1;
                    } else if (meta.page <= 4) {
                      pageNum = i + 1;
                    } else if (meta.page >= meta.pageCount - 3) {
                      pageNum = meta.pageCount - 6 + i;
                    } else {
                      pageNum = meta.page - 3 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={meta.page === pageNum ? 'default' : 'tertiary'}
                        onClick={() => handlePageChange(pageNum)}
                        size="S"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <IconButton
                    label="Next page"
                    onClick={() => handlePageChange(meta.page + 1)}
                    disabled={meta.page >= meta.pageCount}
                  >
                    <ArrowRight />
                  </IconButton>
                </Flex>
              </Flex>
            </Box>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Modal.Close>
            <Button variant="tertiary">Close</Button>
          </Modal.Close>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};

export { DataModal };
export default DataModal;
