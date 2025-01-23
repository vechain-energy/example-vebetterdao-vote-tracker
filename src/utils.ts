import { ApolloClient, InMemoryCache } from '@apollo/client';
import { RESOLVE_VET_DOMAIN } from './queries';
import { SUBGRAPH_URL_VNS } from './config';

// Initialize Apollo Client
const client = new ApolloClient({
  uri: SUBGRAPH_URL_VNS,
  cache: new InMemoryCache(),
});

export async function resolveVetDomain(name: string): Promise<string | null> {
  try {
    const { data } = await client.query({
      query: RESOLVE_VET_DOMAIN,
      variables: { name },
    });

    const domain = data.domains[0];
    if (domain && domain.resolvedAddress) {
      return domain.resolvedAddress.id.toLowerCase();
    } else {
      throw new Error('Domain not found');
    }
  } catch (error) {
    console.error('Error resolving VET domain:', error);
    return null;
  }
} 