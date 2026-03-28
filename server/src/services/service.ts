import type { Core } from '@strapi/strapi';

interface GetCollectionDataParams {
  uid: string;
  page: number;
  pageSize: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: string;
}

// Strapi system fields that are auto-managed — not user-defined content
const SYSTEM_FIELDS = [
  'createdAt',
  'updatedAt',
  'publishedAt',
  'createdBy',
  'updatedBy',
  'locale',
  'localizations',
];

// Field types to exclude entirely
const EXCLUDED_TYPES = ['password', 'dynamiczone', 'component'];

const service = ({ strapi }: { strapi: Core.Strapi }) => ({
  getContentTypes() {
    const contentTypes = strapi.contentTypes;
    const collectionTypes: Array<{ uid: string; displayName: string; attributes: Record<string, any> }> = [];

    for (const [uid, contentType] of Object.entries(contentTypes)) {
      if (uid.startsWith('api::') && contentType.kind === 'collectionType') {
        const attributes: Record<string, any> = {};
        for (const [key, attr] of Object.entries(contentType.attributes)) {
          const type = (attr as any).type;
          if (!EXCLUDED_TYPES.includes(type) && !SYSTEM_FIELDS.includes(key)) {
            attributes[key] = {
              type,
              required: (attr as any).required || false,
            };
          }
        }
        collectionTypes.push({
          uid,
          displayName: contentType.info?.displayName || uid,
          attributes,
        });
      }
    }

    return collectionTypes;
  },

  /**
   * Returns only user-defined attributes, excluding system fields and sensitive types.
   */
  _getAllAttributes(contentType: any) {
    const attributes: Record<string, any> = {};
    for (const [key, attr] of Object.entries(contentType.attributes)) {
      const type = (attr as any).type;
      if (!EXCLUDED_TYPES.includes(type) && !SYSTEM_FIELDS.includes(key)) {
        attributes[key] = { type };
      }
    }
    return attributes;
  },

  /**
   * Returns populate config for user-defined media and relation fields only.
   */
  _getMediaPopulate(contentType: any) {
    const populate: Record<string, boolean> = {};
    for (const [key, attr] of Object.entries(contentType.attributes)) {
      const type = (attr as any).type;
      if ((type === 'media' || type === 'relation') && !SYSTEM_FIELDS.includes(key)) {
        populate[key] = true;
      }
    }
    return Object.keys(populate).length > 0 ? populate : undefined;
  },

  _buildFilters(contentType: any, { search, startDate, endDate }: { search?: string; startDate?: string; endDate?: string }) {
    const filters: any = {};

    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = startDate;
      if (endDate) filters.createdAt.$lte = endDate;
    }

    if (search) {
      const searchableAttributes = Object.entries(contentType.attributes)
        .filter(([key, attr]) => {
          const type = (attr as any).type;
          return ['string', 'text', 'richtext', 'email'].includes(type) && !SYSTEM_FIELDS.includes(key);
        })
        .map(([key]) => key);

      if (searchableAttributes.length > 0) {
        filters.$or = searchableAttributes.map((attr) => ({
          [attr]: { $containsi: search },
        }));
      }
    }

    return filters;
  },

  /**
   * Strip sensitive fields (like password hashes) from entry data before returning.
   */
  _sanitizeEntries(entries: any[], contentType: any) {
    const sensitiveKeys: string[] = [];
    for (const [key, attr] of Object.entries(contentType.attributes)) {
      if ((attr as any).type === 'password') {
        sensitiveKeys.push(key);
      }
    }
    if (sensitiveKeys.length === 0) return entries;

    return entries.map((entry) => {
      const clean = { ...entry };
      for (const key of sensitiveKeys) {
        delete clean[key];
      }
      return clean;
    });
  },

  async getCollectionData({
    uid,
    page,
    pageSize,
    search,
    startDate,
    endDate,
    sortBy,
    sortOrder = 'desc',
  }: GetCollectionDataParams) {
    const contentType = strapi.contentTypes[uid as keyof typeof strapi.contentTypes];
    if (!contentType) {
      throw new Error(`Content type ${uid} not found`);
    }

    const filters = this._buildFilters(contentType, { search, startDate, endDate });
    const populate = this._getMediaPopulate(contentType);

    const sort: Record<string, string> = {};
    if (sortBy) {
      sort[sortBy] = sortOrder || 'desc';
    } else {
      sort.createdAt = 'desc';
    }

    const queryOptions: any = {
      filters,
      sort,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    };
    if (populate) queryOptions.populate = populate;

    const entries = await strapi.documents(uid as any).findMany(queryOptions);
    const total = await strapi.documents(uid as any).count({ filters });
    const attributes = this._getAllAttributes(contentType);

    return {
      data: this._sanitizeEntries(entries, contentType),
      meta: {
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
        total,
      },
      attributes,
    };
  },

  async exportAllData({
    uid,
    search,
    startDate,
    endDate,
    sortBy,
    sortOrder = 'desc',
  }: Omit<GetCollectionDataParams, 'page' | 'pageSize'>) {
    const contentType = strapi.contentTypes[uid as keyof typeof strapi.contentTypes];
    if (!contentType) {
      throw new Error(`Content type ${uid} not found`);
    }

    const filters = this._buildFilters(contentType, { search, startDate, endDate });
    const populate = this._getMediaPopulate(contentType);
    const attributes = this._getAllAttributes(contentType);

    const sort: Record<string, string> = {};
    if (sortBy) {
      sort[sortBy] = sortOrder || 'desc';
    } else {
      sort.createdAt = 'desc';
    }

    // Build headers: documentId + user-defined fields + timestamps (no duplicates)
    const userColumnKeys = Object.keys(attributes);
    const headers = ['documentId', ...userColumnKeys, 'createdAt', 'updatedAt'];

    const batchSize = 100;
    let offset = 0;
    let allEntries: any[] = [];
    let batch: any[];

    do {
      const queryOptions: any = {
        filters,
        sort,
        limit: batchSize,
        offset,
      };
      if (populate) queryOptions.populate = populate;

      batch = await strapi.documents(uid as any).findMany(queryOptions);
      allEntries = allEntries.concat(batch);
      offset += batchSize;
    } while (batch.length === batchSize);

    return {
      data: this._sanitizeEntries(allEntries, contentType),
      headers,
      attributes,
      total: allEntries.length,
    };
  },
});

export default service;
