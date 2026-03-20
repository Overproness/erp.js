import * as actionTypes from './types';

const INITIAL_STATE = {
  // Loading states
  isLoading: false,
  isSuccess: false,
  error: null,

  // Accounts
  accounts: {
    list: [],
    current: null,
    isLoading: false,
    error: null,
  },

  // Posts
  posts: {
    list: [],
    scheduled: [],
    current: null,
    isLoading: false,
    error: null,
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
  },

  // Analytics
  analytics: {
    overview: null,
    accounts: {},
    posts: {},
    campaigns: {},
    isLoading: false,
    error: null,
    period: '7d',
  },

  // Mentions
  mentions: {
    list: [],
    current: null,
    isLoading: false,
    error: null,
    trackedKeywords: [],
    sentiment: null,
  },

  // Campaigns
  campaigns: {
    list: [],
    current: null,
    isLoading: false,
    error: null,
  },

  // UI State
  filters: {
    posts: 'all', // all, published, scheduled, draft
    platform: 'all', // all, facebook, instagram, twitter
    dateRange: null,
  },
  
  searchQuery: '',
};

const socialMediaReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    // General loading states
    case actionTypes.REQUEST_LOADING:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case actionTypes.REQUEST_SUCCESS:
      return {
        ...state,
        isLoading: false,
        isSuccess: true,
        error: null,
      };

    case actionTypes.REQUEST_FAILED:
      return {
        ...state,
        isLoading: false,
        isSuccess: false,
        error: action.payload,
      };

    // Account actions
    case actionTypes.LOAD_ACCOUNTS_REQUEST:
      return {
        ...state,
        accounts: {
          ...state.accounts,
          isLoading: true,
          error: null,
        },
      };

    case actionTypes.LOAD_ACCOUNTS_SUCCESS:
      return {
        ...state,
        accounts: {
          ...state.accounts,
          list: action.payload,
          isLoading: false,
          error: null,
        },
      };

    case actionTypes.LOAD_ACCOUNTS_FAILED:
      return {
        ...state,
        accounts: {
          ...state.accounts,
          isLoading: false,
          error: action.payload,
        },
      };

    case actionTypes.CONNECT_ACCOUNT_SUCCESS:
      return {
        ...state,
        accounts: {
          ...state.accounts,
          list: [...state.accounts.list, action.payload],
        },
      };

    case actionTypes.DISCONNECT_ACCOUNT_SUCCESS:
      return {
        ...state,
        accounts: {
          ...state.accounts,
          list: state.accounts.list.filter(account => account._id !== action.payload),
        },
      };

    // Post actions
    case actionTypes.LOAD_POSTS_REQUEST:
      return {
        ...state,
        posts: {
          ...state.posts,
          isLoading: true,
          error: null,
        },
      };

    case actionTypes.LOAD_POSTS_SUCCESS:
      return {
        ...state,
        posts: {
          ...state.posts,
          list: action.payload.items || action.payload,
          pagination: action.payload.pagination || state.posts.pagination,
          isLoading: false,
          error: null,
        },
      };

    case actionTypes.LOAD_POSTS_FAILED:
      return {
        ...state,
        posts: {
          ...state.posts,
          isLoading: false,
          error: action.payload,
        },
      };

    case actionTypes.CREATE_POST_SUCCESS:
      return {
        ...state,
        posts: {
          ...state.posts,
          list: [action.payload, ...state.posts.list],
        },
      };

    case actionTypes.PUBLISH_POST_SUCCESS:
    case actionTypes.SCHEDULE_POST_SUCCESS:
      return {
        ...state,
        posts: {
          ...state.posts,
          list: state.posts.list.map(post =>
            post._id === action.payload._id ? action.payload : post
          ),
        },
      };

    // Analytics actions
    case actionTypes.LOAD_ANALYTICS_REQUEST:
      return {
        ...state,
        analytics: {
          ...state.analytics,
          isLoading: true,
          error: null,
        },
      };

    case actionTypes.LOAD_ANALYTICS_SUCCESS:
      return {
        ...state,
        analytics: {
          ...state.analytics,
          overview: action.payload,
          isLoading: false,
          error: null,
        },
      };

    case actionTypes.LOAD_ANALYTICS_FAILED:
      return {
        ...state,
        analytics: {
          ...state.analytics,
          isLoading: false,
          error: action.payload,
        },
      };

    // Campaign actions
    case actionTypes.LOAD_CAMPAIGNS_REQUEST:
      return {
        ...state,
        campaigns: {
          ...state.campaigns,
          isLoading: true,
          error: null,
        },
      };

    case actionTypes.LOAD_CAMPAIGNS_SUCCESS:
      return {
        ...state,
        campaigns: {
          ...state.campaigns,
          list: action.payload,
          isLoading: false,
          error: null,
        },
      };

    case actionTypes.CREATE_CAMPAIGN_SUCCESS:
      return {
        ...state,
        campaigns: {
          ...state.campaigns,
          list: [action.payload, ...state.campaigns.list],
        },
      };

    // Mentions actions
    case actionTypes.LOAD_MENTIONS_REQUEST:
      return {
        ...state,
        mentions: {
          ...state.mentions,
          isLoading: true,
          error: null,
        },
      };

    case actionTypes.LOAD_MENTIONS_SUCCESS:
      return {
        ...state,
        mentions: {
          ...state.mentions,
          list: action.payload,
          isLoading: false,
          error: null,
        },
      };

    // UI actions
    case actionTypes.SET_CURRENT_POST:
      return {
        ...state,
        posts: {
          ...state.posts,
          current: action.payload,
        },
      };

    case actionTypes.SET_CURRENT_ACCOUNT:
      return {
        ...state,
        accounts: {
          ...state.accounts,
          current: action.payload,
        },
      };

    case actionTypes.SET_CURRENT_CAMPAIGN:
      return {
        ...state,
        campaigns: {
          ...state.campaigns,
          current: action.payload,
        },
      };

    case actionTypes.CLEAR_CURRENT:
      return {
        ...state,
        posts: { ...state.posts, current: null },
        accounts: { ...state.accounts, current: null },
        campaigns: { ...state.campaigns, current: null },
      };

    case actionTypes.SET_POST_FILTER:
      return {
        ...state,
        filters: {
          ...state.filters,
          posts: action.payload,
        },
      };

    case actionTypes.SET_ANALYTICS_PERIOD:
      return {
        ...state,
        analytics: {
          ...state.analytics,
          period: action.payload,
        },
      };

    case actionTypes.SET_SEARCH_QUERY:
      return {
        ...state,
        searchQuery: action.payload,
      };

    default:
      return state;
  }
};

export default socialMediaReducer;
