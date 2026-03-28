export default {
  type: 'admin',
  routes: [
    {
      method: 'GET',
      path: '/content-types',
      handler: 'controller.getContentTypes',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
    {
      method: 'GET',
      path: '/collection',
      handler: 'controller.getCollectionData',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
    {
      method: 'GET',
      path: '/export',
      handler: 'controller.exportCollectionData',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
  ],
};
