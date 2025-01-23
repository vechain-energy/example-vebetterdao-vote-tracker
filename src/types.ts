export interface Vote {
  weight: string;
  round: {
    number: string;
  };
  app: {
    id: string;
    name: string;
  };
}

export interface VoteQueryResponse {
  votes: Vote[];
}

export interface DelegateVote {
  app: {
    id: string;
    name: string;
  };
  weight: string;
  round: {
    number: string;
  };
}

export interface DelegateQueryResponse {
  veDelegateAccounts: {
    account: {
      AllocationVotes: DelegateVote[];
    };
  }[];
}

export interface VetDomainResponse {
  resolverAddress: string;
  address: string;
  name: string;
}

export interface App {
  id: string;
  name: string;
}

export interface AppsQueryResponse {
  apps: App[];
}