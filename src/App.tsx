import React, { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';
import VoteDisplay from './components/VoteDisplay';
import SearchForm from './components/SearchForm';
import Footer from './components/Footer';
import { resolveVetDomain } from './utils';

function App() {
  const [submittedAddress, setSubmittedAddress] = useState<string>('');
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Read address and app from URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const addressParam = params.get('address');
    const appParam = params.get('app');

    if (addressParam) {
      setSubmittedAddress(addressParam);
    }
    if (appParam) {
      setSelectedAppId(appParam);
    }
  }, []);

  const handleSubmit = async (input: string, appId: string) => {
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
      setSelectedAppId(appId);

      // Update URL with the resolved address and selected app
      const url = new URL(window.location.href);
      url.searchParams.set('address', resolvedAddress);
      if (appId) {
        url.searchParams.set('app', appId);
      } else {
        url.searchParams.delete('app');
      }
      window.history.pushState({}, '', url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
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

          <SearchForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            selectedAppId={selectedAppId}
            onAppChange={setSelectedAppId}
          />
        </div>

        {submittedAddress && (
          <VoteDisplay address={submittedAddress} selectedAppId={selectedAppId} />
        )}
      </div>

      <Footer />
    </div>
  );
}

export default App;