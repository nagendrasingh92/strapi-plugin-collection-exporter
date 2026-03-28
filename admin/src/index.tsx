import { PLUGIN_ID } from './pluginId';
import { Initializer } from './components/Initializer';
import { ViewDataButton } from './components/ViewDataButton';

export default {
  register(app: any) {
    app.registerPlugin({
      id: PLUGIN_ID,
      name: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
    });
  },

  bootstrap(app: any) {
    app.getPlugin('content-manager').injectComponent('listView', 'actions', {
      name: `${PLUGIN_ID}.view-data-button`,
      Component: ViewDataButton,
    });
  },

  async registerTrads({ locales }: { locales: string[] }) {
    return Promise.all(
      locales.map(async (locale: string) => {
        return {
          data: {},
          locale,
        };
      })
    );
  },
};
