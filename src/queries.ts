import { gql } from '@apollo/client';

export const GET_APPS = gql`
  query GetApps {
    apps(first: 1000, orderBy: name) {
      id
      name
    }
  }
`;

export const GET_VOTES = gql`
  query VotesByUser($address: String!) {
    votes: allocationVotes(
      orderBy: round__number
      orderDirection: desc
      skip: 0
      first: 1000
      where: {passport_: {id: $address}}
    ) {
      weight
      round {
        number
      }
      app {
        id
        name
      }
    }
  }
`;

export const GET_DELEGATE_VOTES = gql`
  query DelegateVotes($address: String!) {
    veDelegateAccounts(
      where: {token_: {owner: $address}}
    ) {
      account {
        AllocationVotes(orderBy: timestamp, orderDirection: desc, first: 1000) {
          app {
            id
            name
          }
          weight
          round {
            number
          }
        }
      }
    }
  }
`;

export const RESOLVE_VET_DOMAIN = gql`
  query ResolveVetDomain($name: String!) {
    domains(where: { name: $name }) {
      resolvedAddress {
        id
      }
    }
  }
`; 