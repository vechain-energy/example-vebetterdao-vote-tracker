export interface Vote {
  weight: string;
  round: {
    number: number;
  };
  app: App;
}

export interface VoteQueryResponse {
  votes: Vote[];
}

export interface DelegateVote {
  app: App;
  weight: string;
  round: {
    number: number;
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
  domains: {
    resolvedAddress: {
      id: string;
    };
  }[];
}

export interface App {
  id: string;
  name: string;
}

export interface AppsQueryResponse {
  apps: App[];
}