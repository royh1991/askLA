'use client';

import { useState, useCallback } from 'react';
import BootSequence from '@/components/BootSequence';
import Desktop from '@/components/Desktop';

export default function Home() {
  const [booted, setBooted] = useState(false);

  const handleBootComplete = useCallback(() => {
    setBooted(true);
  }, []);

  return (
    <main className="h-screen w-screen overflow-hidden">
      {!booted && <BootSequence onComplete={handleBootComplete} />}
      {booted && <Desktop />}
    </main>
  );
}
