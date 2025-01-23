import type { Vote } from '../types';

interface VoteListProps {
    votes: Vote[];
    selectedAppId: string;
}

function VoteList({ votes, selectedAppId }: VoteListProps) {
    // Group votes by round
    const votesByRound = votes.reduce((acc, vote) => {
        const roundNumber = vote.round.number;
        if (!acc[roundNumber]) {
            acc[roundNumber] = [];
        }
        acc[roundNumber].push(vote);
        return acc;
    }, {} as Record<string, Vote[]>);

    // Sort rounds in descending order
    const sortedRounds = Object.entries(votesByRound).sort((a, b) =>
        parseInt(b[0]) - parseInt(a[0])
    );

    return (
        <div className="space-y-4">
            {sortedRounds.map(([roundNumber, roundVotes]) => {
                const totalWeight = roundVotes.reduce((sum, vote) => sum + parseFloat(vote.weight), 0);

                return (
                    <div key={roundNumber} className="bg-white rounded-lg shadow-md p-4 space-y-4">
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
                                                    <span className="text-xs">Weight: {weight.toFixed(0)} VOT3</span>
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
    );
}

export default VoteList; 