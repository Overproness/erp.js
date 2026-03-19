import { BASE_URL } from '@/config/serverApiConfig';
import storePersist from '@/redux/storePersist';
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: `${BASE_URL}graphql`,
  credentials: 'include',
});

const authLink = setContext((_, { headers }) => {
  const authData = storePersist.get('auth');
  const token = authData?.current?.token;
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
    query: { fetchPolicy: 'network-only' },
  },
});

export default client;
