import React, { useState, useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';
import { Wallet, BarChart3 } from 'lucide-react';
import type { VoteQueryResponse, DelegateQueryResponse, VetDomainResponse, AppsQueryResponse } from './types';

const GET_APPS = gql`
  query GetApps {
    apps(first: 1000, orderBy: name) {
      id
      name
    }
  }
`;

const GET_VOTES = gql`
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

const GET_DELEGATE_VOTES = gql`
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

async function resolveVetDomain(name: string): Promise<string | null> {
  try {
    const response = await fetch(`https://vet.domains/api/lookup/name/${name}`);
    if (!response.ok) {
      throw new Error('Domain not found');
    }
    const data: VetDomainResponse = await response.json();
    return data.address.toLowerCase();
  } catch (error) {
    console.error('Error resolving VET domain:', error);
    return null;
  }
}

function VoteList({ votes, title, selectedAppId }: { votes: any[], title: string, selectedAppId: string }) {
  // Group votes by round
  const votesByRound = votes.reduce((acc, vote) => {
    const roundNumber = vote.round.number;
    if (!acc[roundNumber]) {
      acc[roundNumber] = [];
    }
    acc[roundNumber].push(vote);
    return acc;
  }, {} as Record<string, typeof votes>);

  // Sort rounds in descending order
  const sortedRounds = Object.entries(votesByRound).sort((a, b) =>
    parseInt(b[0]) - parseInt(a[0])
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <BarChart3 className="w-5 h-5" />
        {title}
      </h2>
      <div className="space-y-6">
        {sortedRounds.map(([roundNumber, roundVotes]) => {
          const totalWeight = roundVotes.reduce((sum, vote) => sum + parseFloat(vote.weight), 0);

          return (
            <div key={roundNumber} className="bg-white rounded-lg shadow p-4 space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Round {roundNumber}</h3>
              <div className="space-y-3">
                {roundVotes.map((vote, index) => {
                  const weight = parseFloat(vote.weight);
                  const percentage = (weight / totalWeight) * 100;
                  const isTargetApp = vote.app.id.toLowerCase() === selectedAppId.toLowerCase();

                  return (
                    <div
                      key={index}
                      className={`relative ${isTargetApp ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50 border border-gray-200'
                        } rounded-lg p-4`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <h4 className="font-medium flex items-center gap-2">
                            {vote.app.name || vote.app.id.slice(0, 8)}
                            {isTargetApp && (
                              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                                Target App
                              </span>
                            )}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="font-medium">{percentage.toFixed(2)}%</span>
                            <span className="text-gray-400">|</span>
                            <span className="text-xs">Weight: {weight.toFixed(4)}</span>
                          </div>
                        </div>
                      </div>
                      <div
                        className={`absolute bottom-0 left-0 h-1 rounded-b-lg ${isTargetApp ? 'bg-orange-500' : 'bg-gray-300'
                          }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VoteDisplay({ address, selectedAppId }: { address: string, selectedAppId: string }) {
  const { loading: loadingDirect, error: errorDirect, data: dataDirect } = useQuery<VoteQueryResponse>(GET_VOTES, {
    variables: { address },
    fetchPolicy: 'network-only',
  });

  const { loading: loadingDelegate, error: errorDelegate, data: dataDelegate } = useQuery<DelegateQueryResponse>(GET_DELEGATE_VOTES, {
    variables: { address },
    fetchPolicy: 'network-only',
  });

  if (loadingDirect || loadingDelegate) return (
    <div className="text-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
      <p className="mt-2">Loading votes...</p>
    </div>
  );

  if (errorDirect || errorDelegate) return (
    <div className="text-red-500 p-4 bg-red-50 rounded-lg">
      Error: {errorDirect?.message || errorDelegate?.message}
    </div>
  );

  const directVotes = dataDirect?.votes || [];
  const delegateVotes = dataDelegate?.veDelegateAccounts[0]?.account.AllocationVotes || [];

  // Combine and merge votes by round
  const combinedVotes = [...directVotes, ...delegateVotes];

  if (combinedVotes.length === 0) {
    return (
      <div className="text-gray-500 p-4 bg-yellow-50 rounded-lg border-l-4 border-l-yellow-300">
        No votes found for this address
      </div>
    );
  }

  // Merge votes for the same app within each round
  const mergedVotes = combinedVotes.reduce((acc, vote) => {
    const roundNumber = vote.round.number;
    const appId = vote.app.id;

    if (!acc[roundNumber]) {
      acc[roundNumber] = new Map();
    }

    const existingVote = acc[roundNumber].get(appId);
    if (existingVote) {
      existingVote.weight = (parseFloat(existingVote.weight) + parseFloat(vote.weight)).toString();
    } else {
      acc[roundNumber].set(appId, { ...vote });
    }

    return acc;
  }, {} as Record<string, Map<string, typeof combinedVotes[0]>>);

  // Convert merged votes back to array format
  const totalVotes = Object.entries(mergedVotes).map(([roundNumber, votesMap]) => ({
    roundNumber,
    votes: Array.from(votesMap.values())
  })).sort((a, b) => parseInt(b.roundNumber) - parseInt(a.roundNumber))
    .flatMap(round => round.votes);

  return <VoteList votes={totalVotes} title="Total Votes" selectedAppId={selectedAppId} />;
}

function AppSelector({ value, onChange }: { value: string, onChange: (id: string) => void }) {
  const { loading, error, data } = useQuery<AppsQueryResponse>(GET_APPS, {
    fetchPolicy: 'network-only',
  });

  if (loading) return (
    <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
  );

  if (error) return (
    <div className="text-red-500 text-sm">Error loading apps: {error.message}</div>
  );
  return (
    <div>
      <select
        id="app"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 h-10 items-center ${!value && 'text-gray-400'} text-sm`}
      >
        <option value="">Select App to Track</option>
        {data?.apps.map((app) => (
          <option key={app.id} value={app.id}>
            {app.name || app.id.slice(0, 8)}
          </option>
        ))}
      </select>
    </div>
  );
}

function App() {
  const [input, setInput] = useState('');
  const [submittedAddress, setSubmittedAddress] = useState('');
  const [selectedAppId, setSelectedAppId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read address and app from URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const addressParam = params.get('address');
    const appParam = params.get('app');
    
    if (addressParam) {
      setInput(addressParam);
      setSubmittedAddress(addressParam);
    }
    if (appParam) {
      setSelectedAppId(appParam);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let resolvedAddress = input.toLowerCase();

      // Check if input is a .vet domain
      if (input.toLowerCase().endsWith('.vet')) {
        const resolved = await resolveVetDomain(input);
        if (!resolved) {
          throw new Error('Could not resolve .vet domain');
        }
        resolvedAddress = resolved;
      }

      setSubmittedAddress(resolvedAddress);
      
      // Update URL with the resolved address and selected app
      const url = new URL(window.location.href);
      url.searchParams.set('address', resolvedAddress);
      url.searchParams.set('app', selectedAppId);
      window.history.pushState({}, '', url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    if (submittedAddress) {
      const url = new URL(window.location.href);
      url.searchParams.set('address', submittedAddress);
      url.searchParams.set('app', selectedAppId);
      navigator.clipboard.writeText(url.toString());
    }
  };

  const handleAppChange = (appId: string) => {
    setSelectedAppId(appId);
    if (submittedAddress) {
      const url = new URL(window.location.href);
      url.searchParams.set('address', submittedAddress);
      url.searchParams.set('app', appId);
      window.history.pushState({}, '', url);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          <div className='space-y-2'>
            <div className="flex items-center gap-2">
              <Wallet className="w-6 h-6 text-orange-500" />
              <h1 className="text-2xl font-bold text-gray-900">VeBetterDAO Vote Tracker</h1>
            </div>

            <p className='text-xs text-gray-400'>
              Track the voting behavior for a specific user. List a single app to highlight. Included in the votes are those cast directly and those made using their veDelegate staking wallet.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="mt-1">
                <input
                  type="text"
                  id="address"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter wallet address or .vet domain"
                  className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 h-10"
                  disabled={isLoading}
                />
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            <AppSelector value={selectedAppId} onChange={handleAppChange} />

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Resolving...' : 'Query Votes'}
              </button>
              {submittedAddress && (
                <button
                  type="button"
                  onClick={handleShare}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Copy Link
                </button>
              )}
            </div>
          </form>

          {submittedAddress && selectedAppId && (
            <VoteDisplay address={submittedAddress} selectedAppId={selectedAppId} />
          )}
        </div>
      </div>
      <footer className="mt-8 text-center text-gray-500 text-xs">
        Made with <span role="img" aria-label="heart">❤️</span> by <a href="https://vechain.energy" className="text-orange-500 hover:underline">vechain.energy</a>
      </footer>
    </div>
  );
}

export default App;