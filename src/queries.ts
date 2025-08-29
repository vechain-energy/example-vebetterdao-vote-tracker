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
      id
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
          id
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

export const GET_LOCK2EARN_TERMS = gql`
  query Lock2EarnTerms($address: String!) {
    veDelegateAccounts(
      where: {token_: {owner: $address}}
    ) {
      id
    }
  }
`;

export const GET_LOCK2EARN_TERMS_VOTES = gql`
  query Lock2EarnTermsVotes($delegateIds: [String!]!) {
    lock2EarnTerms(
      first: 100
      orderBy: createdAt
      orderDirection: desc
      where: {owner_in: $delegateIds}
    ) {
      id
      veDelegateAccount {
        account {
          AllocationVotes(orderBy: timestamp, orderDirection: desc, first: 1000) {
            id
            app {
              name
              id
            }
            weight
            round {
              number
            }
          }
        }
      }
    }
  }
`;

export const RESOLVE_VET_DOMAIN = gql`
  query ResolveVetDomain($name: String!) {
    domains(where: { name: $name }) {
      resolver {
        addr {
          id
        }
      }
    }
  }
`; 