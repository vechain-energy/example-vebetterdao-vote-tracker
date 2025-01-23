import React, { useState } from 'react';
import AppSelector from './AppSelector';

interface SearchFormProps {
  onSubmit: (address: string, appId: string) => void;
  isLoading: boolean;
  error: string | null;
  selectedAppId: string;
  onAppChange: (appId: string) => void;
}

function SearchForm({ onSubmit, isLoading, error, selectedAppId, onAppChange }: SearchFormProps) {
  const [input, setInput] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(input, selectedAppId);
  };

  return (
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

      <AppSelector value={selectedAppId} onChange={onAppChange} />

      <button
        type="submit"
        disabled={isLoading}
        className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed w-full"
      >
        {isLoading ? 'Resolving...' : 'Query Votes'}
      </button>
    </form>
  );
}

export default SearchForm; 