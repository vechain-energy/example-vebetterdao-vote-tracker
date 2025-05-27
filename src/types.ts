export interface Vote {
  id: string;
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
  id: string;
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
    resolver: {
      addr: {
        id: string;
      };
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