import React, { useState, useEffect } from 'react';

export default function SimplePage() {
  const [data, setData] = useState<string>('Initial state');

  useEffect(() => {
    console.log('Simple page: useEffect triggered');
    
    const testFetch = async () => {
      try {
        console.log('Simple page: Starting fetch...');
        setData('Fetching...');
        
        const response = await fetch('/api/strategies');
        console.log('Simple page: Got response:', response.status);
        
        const result = await response.json();
        console.log('Simple page: Got data:', result);
        
        setData(`Success! Got ${Array.isArray(result) ? result.length : 'unknown'} items`);
      } catch (error) {
        console.error('Simple page: Error:', error);
        setData(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    testFetch();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Simple Test Page</h1>
      <p>Status: {data}</p>
      <p>Check browser console for logs</p>
    </div>
  );
} 