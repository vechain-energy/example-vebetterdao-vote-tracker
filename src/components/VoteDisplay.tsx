import React from 'react';
import { useQuery } from '@apollo/client';
import type { VoteQueryResponse, DelegateQueryResponse } from '../types';
import { GET_VOTES, GET_DELEGATE_VOTES } from '../queries';
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

    return <VoteList votes={totalVotes} selectedAppId={selectedAppId} />;
}

export default VoteDisplay; 