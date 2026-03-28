'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TerminalLine {
  type: 'input' | 'output' | 'system' | 'error';
  text: string;
}

const WELCOME = [
  { type: 'system' as const, text: '╔══════════════════════════════════════════════════╗' },
  { type: 'system' as const, text: '║  askLA Terminal — Ask the Public Record           ║' },
  { type: 'system' as const, text: '║  Type a question to search 10,698 meetings        ║' },
  { type: 'system' as const, text: '║  1,590 transcripts · 20.9M words indexed           ║' },
  { type: 'system' as const, text: '╚══════════════════════════════════════════════════╝' },
  { type: 'system' as const, text: '' },
  { type: 'system' as const, text: 'Try: "rent stabilization" · "transit signal priority"' },
  { type: 'system' as const, text: '     "CF 25-1026" · "what did Raman say about housing?"' },
  { type: 'system' as const, text: '' },
];

// Canned responses for demo
const RESPONSES: Record<string, string[]> = {
  'help': [
    'Available commands:',
    '  search <query>  — Search transcripts and council files',
    '  meeting <id>    — View meeting details',
    '  member <name>   — View council member profile',
    '  file <number>   — View council file',
    '  stats           — Database statistics',
    '  clear           — Clear terminal',
    '  help            — This message',
  ],
  'stats': [
    '[■] DATABASE STATISTICS',
    '  Meetings indexed:     10,698',
    '  Transcripts loaded:    1,590',
    '  Words transcribed:    20.9M',
    '  Agenda documents:    10,672',
    '  Council files:        5,200+',
    '  Public speakers:      8,400+',
    '  Date range:          2008 — 2026',
    '  Last updated:         2026-03-28',
  ],
  'rent stabilization': [
    'Searching transcripts for "rent stabilization"...',
    '',
    '23 results across 14 meetings:',
    '',
    '  1. Housing Committee · Mar 17, 2025 · CF 25-1026',
    '     "...extending rent stabilization protections to buildings',
    '     constructed after 1978 in the Koreatown area would affect',
    '     approximately 4,200 units..."',
    '     — Nithya Raman, during agenda item discussion',
    '',
    '  2. City Council · Feb 28, 2025 · Public Comment',
    '     "My name is Maria Gutierrez, I live on Normandie. I\'m asking',
    '     the council to protect tenants in Koreatown from these rent',
    '     increases..."',
    '     — Maria Gutierrez, public commenter',
    '',
    '  3. PLUM Committee · Jan 15, 2025 · CF 25-1026',
    '     "The fiscal impact analysis shows that property owners of',
    '     buildings with 4 or fewer units would be disproportionately',
    '     affected..."',
    '     — Harris, committee Q&A',
    '',
    'Type "file 25-1026" for full council file details.',
  ],
  'transit signal priority': [
    'Searching transcripts for "transit signal priority"...',
    '',
    '8 results across 3 meetings:',
    '',
    '  1. Transportation Committee · Mar 11, 2026 · Item 2',
    '     "When the 10 shut down after the 2023 fire, the city adjusted',
    '     signal timing to accommodate increased Metro ridership. That',
    '     proves signal priority is a policy choice."',
    '     — Public commenter',
    '',
    '  2. Transportation Committee · Mar 11, 2026 · Item 2',
    '     "I\'d like to commend LADOT for putting out a great memo, and',
    '     I\'d like to encourage them to continue the signal preemption',
    '     work."',
    '     — Colin Warren, car-free aerospace engineer',
    '',
    '  Strong public support (4/4 commenters in favor)',
    '  Item continued to future meeting.',
  ],
  'file 25-1026': [
    '[~] CF 25-1026 — Rent Stabilization Extension',
    '    Status: IN COMMITTEE',
    '    Author: Nithya Raman (CD-4)',
    '',
    '    Timeline:',
    '    ● 2025-01-08  Introduced, referred to Housing',
    '    ● 2025-03-03  Housing hearing (14 speakers: 11 support, 3 oppose)',
    '    ● 2025-03-17  Amended: exempt 4-unit buildings (4-1)',
    '    ○ 2025-04-02  Full Council — PENDING',
    '',
    '    Would extend RSO to ~200,000 post-1978 units.',
    '    Open "Council Files" app for full details.',
  ],
};

export default function Terminal() {
  const [lines, setLines] = useState<TerminalLine[]>([...WELCOME]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const handleCommand = async (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    setLines(prev => [...prev, { type: 'input', text: `askLA> ${cmd}` }]);
    setIsProcessing(true);

    if (trimmed === 'clear') {
      setLines([...WELCOME]);
      setIsProcessing(false);
      return;
    }

    // Simulate processing delay
    await new Promise(r => setTimeout(r, 300 + Math.random() * 500));

    // Find matching response
    let response: string[] | null = null;
    for (const [key, val] of Object.entries(RESPONSES)) {
      if (trimmed === key || trimmed.includes(key)) {
        response = val;
        break;
      }
    }

    if (!response) {
      response = [
        `Searching for "${cmd}"...`,
        '',
        `No results found in the current demo dataset.`,
        `In the full version, this would search across all 10,698 meetings`,
        `and 20.9M words of transcripts.`,
        '',
        'Try: "rent stabilization" · "transit signal priority" · "stats" · "help"',
      ];
    }

    setLines(prev => [
      ...prev,
      ...response!.map(text => ({ type: 'output' as const, text })),
      { type: 'output', text: '' },
    ]);
    setIsProcessing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    handleCommand(input);
    setInput('');
  };

  return (
    <div
      className="h-full flex flex-col bg-[#1A1A1A] font-mono text-[12px]"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Terminal content */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-2 pb-0">
        {lines.map((line, i) => (
          <div key={i} className="leading-[18px] whitespace-pre-wrap">
            {line.type === 'input' ? (
              <span className="text-[#40916C]">{line.text}</span>
            ) : line.type === 'system' ? (
              <span className="text-[#808080]">{line.text}</span>
            ) : line.type === 'error' ? (
              <span className="text-[#C1292E]">{line.text}</span>
            ) : (
              <span className="text-[#F5F1EB]">{line.text}</span>
            )}
          </div>
        ))}

        {isProcessing && (
          <motion.span
            className="text-[#40916C]"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            Processing...
          </motion.span>
        )}
      </div>

      {/* Input line */}
      <form onSubmit={handleSubmit} className="flex items-center px-2 py-1 border-t border-[#333]">
        <span className="text-[#40916C] mr-1">askLA&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 bg-transparent text-[#F5F1EB] outline-none font-mono text-[12px] caret-[#40916C]"
          placeholder=""
          disabled={isProcessing}
          autoFocus
        />
        <span className="cursor-blink text-[#40916C]">_</span>
      </form>
    </div>
  );
}
