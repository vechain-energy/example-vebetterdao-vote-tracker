import React from 'react';
import { useQuery } from '@apollo/client';
import type { AppsQueryResponse } from '../types';
import { GET_APPS } from '../queries';

interface AppSelectorProps {
  value: string;
  onChange: (id: string) => void;
}

function AppSelector({ value, onChange }: AppSelectorProps) {
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

export default AppSelector; 