import { createLayoutServiceClient } from '../../lib/layoutServiceUtils';
import { getConfig } from '../../temp/config';

export const state = () => ({
  sitecoreContext: {},
  routeData: null,
  currentRoute: '',
  routeDataFetchStatus: '',
  routeDataFetchError: null,
});

export const mutations = {
  setLayoutData(state, { layoutData }) {
    if (!layoutData) {
      return;
    }

    const routeData = layoutData.sitecore && layoutData.sitecore.route;
    state.routeData = routeData;

    const context = (layoutData.sitecore && layoutData.sitecore.context) || {};
    state.sitecoreContext = {
      ...context,
      routeName: routeData && routeData.name,
      itemId: routeData && routeData.itemId,
    };
  },
  setCurrentRoute(state, { route }) {
    state.currentRoute = route;
  },
  setRouteDataFetchStatus(state, { status, error }) {
    state.routeDataFetchStatus = status;
    state.routeDataFetchError = error;
  },
};

export const actions = {
  getLayoutData(context, { route, language, nuxtContext }) {
    const { req } = nuxtContext;

    // If the incoming request exists it means we're in SSR.
    // If the incoming request has a `jssData` property, it means the app
    // is responding to either a proxy request or a JSS rendering host request.
    // In either case, we set layout data from the `jssData` property instead
    // of trying to fetch data from Layout Service.
    if (req && req.jssData) {
      context.commit('setLayoutData', { layoutData: req.jssData.route });
      context.commit('setCurrentRoute', { route });
      return Promise.resolve();
    } else {
      // This is a client-side request for layout data, e.g. route change.
      const config = getConfig();
      const layoutServiceClient = createLayoutServiceClient(config, { nuxtContext });

      context.commit('setRouteDataFetchStatus', { status: 'loading', error: null });
      return layoutServiceClient
        .getRouteData(route, language)
        .then((layoutData) => {
          context.commit('setLayoutData', { layoutData });
          context.commit('setCurrentRoute', { route });
          context.commit('setRouteDataFetchStatus', { status: '', error: null });
        })
        .catch((error) => {
          if (error.response && error.response.data && error.response.data.sitecore) {
            context.commit('setLayoutData', { layoutData: error.response.data });
          }
          context.commit('setCurrentRoute', { route });
          context.commit('setRouteDataFetchStatus', { status: 'error', error });
        });
    }
  },
  nuxtServerInit(nuxtContext) {
    // implement any server-specific actions here
  },
};
