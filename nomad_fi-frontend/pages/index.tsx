import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/landing');
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl mb-4">LOADING...</div>
        <div className="text-sm">REDIRECTING TO NOMADFI LANDING PAGE</div>
      </div>
    </div>
  );
} 