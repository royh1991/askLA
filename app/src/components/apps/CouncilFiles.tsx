'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const SAMPLE_FILES = [
  {
    number: '25-1026',
    title: 'Rent Stabilization Extension — Post-1978 Buildings',
    status: 'IN COMMITTEE',
    author: 'Nithya Raman (CD-4)',
    committee: 'Housing',
    introduced: '2025-01-08',
    timeline: [
      { date: '2025-01-08', event: 'Introduced by Raman, referred to Housing', type: 'introduced' },
      { date: '2025-03-03', event: 'Housing Cmte hearing — 14 speakers (11 support, 3 oppose)', type: 'heard' },
      { date: '2025-03-17', event: 'Housing Cmte — Amendment by Harris: exempt 4-unit bldgs. Passed 4-1', type: 'amended' },
      { date: '2025-04-02', event: 'Full Council — PENDING', type: 'pending' },
    ],
    summary: 'This motion would extend LA\'s rent stabilization law to cover apartment buildings built after 1978. About 200,000 additional units would get rent caps.',
  },
  {
    number: '24-1100',
    title: 'Transit Signal Priority Implementation',
    status: 'IN COMMITTEE',
    author: 'Transportation Committee',
    committee: 'Transportation',
    introduced: '2024-11-15',
    timeline: [
      { date: '2024-11-15', event: 'Introduced, referred to Transportation', type: 'introduced' },
      { date: '2026-03-11', event: 'DOT report presented. Continued to future meeting', type: 'heard' },
    ],
    summary: 'Direct LADOT to implement signal preemption for all at-grade light rail and BRT lines to reduce transit travel times.',
  },
  {
    number: '15-1138-S42',
    title: 'Venice Mobility Hub — Lot 731 Feasibility Study',
    status: 'ADOPTED',
    author: 'Park (CD-11)',
    committee: 'Transportation',
    introduced: '2025-10-01',
    timeline: [
      { date: '2025-10-01', event: 'Council directed LADOT to report on steps needed', type: 'introduced' },
      { date: '2026-03-11', event: 'DOT presented feasibility plan. $175K appropriated. Adopted 4-0', type: 'voted' },
    ],
    summary: 'Feasibility study for a mobility hub at Parking Lot 731 in Venice for the 2028 Olympics. Includes shuttle, EV charging, bike-share.',
  },
  {
    number: '26-0117',
    title: 'LAPD Overtime Budget Authorization',
    status: 'ADOPTED',
    author: 'Budget & Finance Committee',
    committee: 'Budget & Finance',
    introduced: '2026-01-10',
    timeline: [
      { date: '2026-01-10', event: 'Introduced, referred to Budget & Finance', type: 'introduced' },
      { date: '2026-03-12', event: 'Full Council vote: Passed 10-5', type: 'voted' },
    ],
    summary: '$50M supplemental appropriation for LAPD overtime. Contentious vote with 5 dissents.',
  },
];

const STATUS_COLORS: Record<string, string> = {
  'IN COMMITTEE': 'bg-[#FFF8E1] text-[#D4A017] border-[#D4A017]',
  'ADOPTED': 'bg-[#E8F5E9] text-[#2D6A4F] border-[#2D6A4F]',
  'FAILED': 'bg-[#FFEBEE] text-[#C1292E] border-[#C1292E]',
  'PENDING': 'bg-[#E3F2FD] text-[#1565C0] border-[#1565C0]',
};

const EVENT_ICONS: Record<string, string> = {
  introduced: '●',
  heard: '◐',
  amended: 'Δ',
  voted: '✓',
  pending: '○',
};

export default function CouncilFiles() {
  const [selectedFile, setSelectedFile] = useState<number>(0);
  const file = SAMPLE_FILES[selectedFile];

  return (
    <div className="flex h-full text-[11px]">
      {/* Menu bar */}
      <div className="absolute top-0 left-0 right-0 bg-[#ECF0F8] border-b border-[#B0C0D0] px-2 py-[2px] flex gap-4 text-[11px] z-10">
        <span className="hover:bg-[#3168D5] hover:text-white px-1 rounded cursor-pointer"><u>F</u>ile</span>
        <span className="hover:bg-[#3168D5] hover:text-white px-1 rounded cursor-pointer"><u>V</u>iew</span>
        <span className="hover:bg-[#3168D5] hover:text-white px-1 rounded cursor-pointer"><u>T</u>rack</span>
        <span className="hover:bg-[#3168D5] hover:text-white px-1 rounded cursor-pointer"><u>H</u>elp</span>
      </div>

      {/* File list (left pane) */}
      <div className="w-[200px] border-r border-[#808080] bg-white overflow-auto mt-[20px]">
        <div className="bg-[#ECF0F8] px-2 py-1 text-[10px] font-bold border-b border-[#B0C0D0]">
          Council Files ({SAMPLE_FILES.length})
        </div>
        {SAMPLE_FILES.map((f, i) => (
          <div
            key={f.number}
            className={`px-2 py-1.5 cursor-pointer border-b border-[#E0E0E0] ${
              selectedFile === i ? 'bg-[#3168D5] text-white' : 'hover:bg-[#E8F0F8]'
            }`}
            onClick={() => setSelectedFile(i)}
          >
            <div className="font-mono font-bold text-[10px]">CF {f.number}</div>
            <div className={`text-[10px] truncate ${selectedFile === i ? 'text-[#C0C0C0]' : 'text-[#808080]'}`}>
              {f.title}
            </div>
          </div>
        ))}
      </div>

      {/* Detail pane (right) */}
      <div className="flex-1 overflow-auto bg-[#F5F1EB] mt-[20px] p-3">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-[14px] font-bold text-[#1B4332] font-mono">CF {file.number}</h2>
            <h3 className="text-[13px] font-bold text-[#1A1A1A] mt-0.5" style={{ fontFamily: 'Georgia, serif' }}>
              {file.title}
            </h3>
            <div className="text-[10px] text-[#808080] flex gap-3 mt-1">
              <span>Author: {file.author}</span>
              <span>Committee: {file.committee}</span>
              <span>Introduced: {file.introduced}</span>
            </div>
          </div>
          <span className={`text-[9px] px-2 py-0.5 rounded border font-bold font-mono ${STATUS_COLORS[file.status] || ''}`}>
            {file.status}
          </span>
        </div>

        {/* Plain English summary */}
        <div className="mb-3">
          <div className="bracket-header">[?] PLAIN ENGLISH</div>
          <div className="bg-white border border-[#D4D7CD] rounded p-2 text-[11px] text-[#404040] leading-[16px]">
            {file.summary}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <div className="bracket-header">[~] TIMELINE</div>
          <div className="relative pl-6">
            {/* Vertical line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[#D4D7CD]" />

            {file.timeline.map((event, i) => (
              <motion.div
                key={i}
                className="relative mb-3 last:mb-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                {/* Timeline dot */}
                <div className={`absolute left-[-17px] top-[3px] w-[14px] h-[14px] flex items-center justify-center text-[10px] rounded-full ${
                  event.type === 'pending'
                    ? 'bg-white border-2 border-[#D4A017] text-[#D4A017]'
                    : 'bg-[#2D6A4F] text-white border-2 border-[#2D6A4F]'
                }`}>
                  <span className="text-[8px]">{EVENT_ICONS[event.type]}</span>
                </div>

                <div className="bg-white border border-[#D4D7CD] rounded px-2 py-1.5">
                  <div className="text-[10px] text-[#808080] font-mono">{event.date}</div>
                  <div className="text-[11px] text-[#1A1A1A] mt-0.5">{event.event}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
