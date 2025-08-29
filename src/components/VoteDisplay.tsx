import React from 'react';
import { useQuery } from '@apollo/client';
import type { 
  VoteQueryResponse, 
  DelegateQueryResponse, 
  Lock2EarnTermsQueryResponse,
  Lock2EarnTermsVotesQueryResponse 
} from '../types';
import { 
  GET_VOTES, 
  GET_DELEGATE_VOTES, 
  GET_LOCK2EARN_TERMS,
  GET_LOCK2EARN_TERMS_VOTES 
} from '../queries';
import VoteList from './VoteList';

interface VoteDisplayProps {
    address: string;
    selectedAppId: string;
}

function VoteDisplay({ address, selectedAppId }: VoteDisplayProps) {
    const { loading: loadingDirect, error: errorDirect, data: dataDirect } = useQuery<VoteQueryResponse>(GET_VOTES, {
        variables: { address },
        fetchPolicy: 'network-only',
    });

    const { loading: loadingDelegate, error: errorDelegate, data: dataDelegate } = useQuery<DelegateQueryResponse>(GET_DELEGATE_VOTES, {
        variables: { address },
        fetchPolicy: 'network-only',
    });

    // Get veDelegate accounts for lock 2 earn terms
    const { loading: loadingLock2EarnAccounts, error: errorLock2EarnAccounts, data: dataLock2EarnAccounts } = useQuery<Lock2EarnTermsQueryResponse>(GET_LOCK2EARN_TERMS, {
        variables: { address, roundNumber: 60 }, // Using round 60 as default
        fetchPolicy: 'network-only',
        skip: !address,
    });

    // Get lock 2 earn terms votes if we have delegate accounts
    const delegateIds = dataLock2EarnAccounts?.veDelegateAccounts?.map(account => account.id) || [];
    const { loading: loadingLock2EarnVotes, error: errorLock2EarnVotes, data: dataLock2EarnVotes } = useQuery<Lock2EarnTermsVotesQueryResponse>(GET_LOCK2EARN_TERMS_VOTES, {
        variables: { 
            delegateIds
        },
        fetchPolicy: 'network-only',
        skip: delegateIds.length === 0,
    });

    if (loadingDirect || loadingDelegate || loadingLock2EarnAccounts || loadingLock2EarnVotes) return (
        <div className="text-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-2">Loading votes...</p>
        </div>
    );

    if (errorDirect || errorDelegate || errorLock2EarnAccounts || errorLock2EarnVotes) return (
        <div className="text-red-500 p-4 bg-red-50 rounded-lg">
            Error: {errorDirect?.message || errorDelegate?.message || errorLock2EarnAccounts?.message || errorLock2EarnVotes?.message}
        </div>
    );

    const directVotes = dataDirect?.votes || [];
    const delegateVotes = dataDelegate?.veDelegateAccounts?.flatMap(account => account.account.AllocationVotes) || [];
    
    // Extract lock 2 earn term votes
    const lock2EarnVotes = dataLock2EarnVotes?.lock2EarnTerms?.flatMap(term => 
        term.veDelegateAccount.account.AllocationVotes
    ) || [];

    // Combine all votes
    const allVotes = [...directVotes, ...delegateVotes, ...lock2EarnVotes];
    
    // Combine and merge votes by round
    const voteMap = new Map();
    allVotes.forEach(vote => {
        if (!voteMap.has(vote.id)) {
            voteMap.set(vote.id, vote);
        }
    });
    const combinedVotes = Array.from(voteMap.values());

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
            acc[roundNumber] = new Map<string, typeof combinedVotes[0]>();
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
    const totalVotes = (Object.entries(mergedVotes) as [string, Map<string, typeof combinedVotes[0]>][]).map(([roundNumber, votesMap]) => ({
        roundNumber,
        votes: Array.from(votesMap.values())
    })).sort((a, b) => parseInt(b.roundNumber) - parseInt(a.roundNumber))
        .flatMap(round => round.votes as typeof combinedVotes);

    return <VoteList votes={totalVotes} selectedAppId={selectedAppId} />;
}

export default VoteDisplay; 