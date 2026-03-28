import type { Core } from '@strapi/strapi';

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  async getContentTypes(ctx: any) {
    const service = strapi.plugin('collection-exporter').service('service');
    ctx.body = await service.getContentTypes();
  },

  async getCollectionData(ctx: any) {
    const { uid, page = 1, pageSize = 10, search, startDate, endDate, sortBy, sortOrder = 'desc' } = ctx.query;

    if (!uid) {
      return ctx.badRequest('uid query parameter is required');
    }

    const service = strapi.plugin('collection-exporter').service('service');
    ctx.body = await service.getCollectionData({
      uid,
      page: Number(page),
      pageSize: Number(pageSize),
      search,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    });
  },

  async exportCollectionData(ctx: any) {
    const { uid, search, startDate, endDate, sortBy, sortOrder = 'desc' } = ctx.query;

    if (!uid) {
      return ctx.badRequest('uid query parameter is required');
    }

    const service = strapi.plugin('collection-exporter').service('service');
    ctx.body = await service.exportAllData({
      uid,
      search,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    });
  },
});

export default controller;
