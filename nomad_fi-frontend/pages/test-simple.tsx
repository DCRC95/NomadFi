import React, { useState, useEffect } from 'react';

export default function TestSimple() {
  const [status, setStatus] = useState<string>('Initializing...');

  useEffect(() => {
    console.log('TestSimple component mounted');
    setStatus('Component mounted successfully');
    
    // Test basic fetch
    fetch('/api/strategies')
      .then(response => {
        console.log('Fetch response status:', response.status);
        setStatus(`API Response: ${response.status}`);
        return response.json();
      })
      .then(data => {
        console.log('API data:', data);
        setStatus(`Found ${data.length} strategies`);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setStatus(`Error: ${err.message}`);
      });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Test</h1>
      <div className="bg-gray-100 p-4 rounded">
        <p><strong>Status:</strong> {status}</p>
      </div>
    </div>
  );
} 