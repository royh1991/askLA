'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

// Sample data from the polished transcript (m17900)
const SAMPLE_MEETING = {
  id: 17900,
  title: 'Transportation Committee',
  date: '2026-03-11',
  duration: '29 min',
  chair: 'Councilwoman Heather Hutt',
  members: [
    { name: 'Hutt', role: 'Chair', present: true },
    { name: 'Hernandez', role: 'Member', present: true },
    { name: 'Park', role: 'Member', present: true },
    { name: 'Nazarian', role: 'Member', present: true, note: 'arrived after roll call' },
    { name: 'Padilla', role: 'Member', present: false },
  ],
  agendaItems: [
    {
      num: '1-7',
      title: 'Non-Controversial Items (Consent)',
      type: 'consent_calendar',
      vote: { result: 'Passed', ayes: 4, nays: 0 },
      items: [
        'CARB Grant Agreement Amendment',
        'Transit Signal Priority Report',
        'Bicycle Lane Camera Enforcement Feasibility',
        'DOT Revenue Programs',
        'Fallen Power Pole on I-110',
        'Transit Passes for Housing Developers',
        'Parking District 55 Expansion',
      ],
    },
    {
      num: '8-9',
      title: 'Oversized Vehicle Parking Restrictions',
      type: 'agenda_item',
      vote: { result: 'Passed', ayes: 3, nays: 1 },
      dissent: 'Hernandez',
    },
    {
      num: '10',
      title: 'DOT Data Privacy & Citation Processing',
      type: 'agenda_item',
      vote: { result: 'Passed', ayes: 4, nays: 0 },
      summary: 'DOT presented protocols for safeguarding motorist privacy in citation processing. Data retained 5 years, encrypted, with subpoena required for PII.',
    },
    {
      num: '11',
      title: 'Venice Mobility Hub — Lot 731',
      type: 'agenda_item',
      vote: { result: 'Passed', ayes: 3, nays: 1, note: 'Amendment bifurcated' },
      summary: 'Feasibility study for mobility hub at Venice Parking Lot 731 for 2028 Olympics. $175K appropriated from Venice Coastal Parking Trust Fund.',
    },
  ],
  publicCommenters: [
    { name: 'Andrew Grabener', items: '2, 4', stance: 'mixed', snippet: 'Put up crossing gates... defund the police and give that money to DOT...' },
    { name: 'Colin Warren', items: '2', stance: 'support', snippet: 'Car-free aerospace engineer from Marina del Rey... commend LADOT for the signal preemption memo.' },
    { name: 'Bobby Garrity', items: '2', stance: 'support', snippet: 'Having a train full of hundreds of people stopped at a red light to allow just a handful of cars to pass is profoundly unjust.' },
    { name: 'Connor Webb', items: '2', stance: 'support', snippet: 'Northwest Neighborhood Council strongly supports signal priority implementation. Trains and BRT should only be stopping at stations, not traffic signals.' },
  ],
};

export default function MeetingViewer() {
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const m = SAMPLE_MEETING;

  return (
    <div className="p-0 text-[11px]">
      {/* Menu bar */}
      <div className="bg-[#ECF0F8] border-b border-[#B0C0D0] px-2 py-[2px] flex gap-4 text-[11px]">
        <span className="hover:bg-[#3168D5] hover:text-white px-1 rounded cursor-pointer"><u>F</u>ile</span>
        <span className="hover:bg-[#3168D5] hover:text-white px-1 rounded cursor-pointer"><u>V</u>iew</span>
        <span className="hover:bg-[#3168D5] hover:text-white px-1 rounded cursor-pointer"><u>M</u>eeting</span>
        <span className="hover:bg-[#3168D5] hover:text-white px-1 rounded cursor-pointer"><u>H</u>elp</span>
      </div>

      {/* Toolbar */}
      <div className="bg-[#ECF0F8] border-b border-[#B0C0D0] px-2 py-1 flex gap-1">
        <button className="xp-button text-[10px]">⏮ Prev</button>
        <button className="xp-button text-[10px]">Next ⏭</button>
        <div className="w-px bg-[#B0C0D0] mx-1" />
        <button className="xp-button text-[10px]">▶ Watch Video</button>
        <div className="flex-1" />
        <span className="text-[10px] text-[#808080] self-center">Meeting ID: m{m.id}</span>
      </div>

      <div className="bg-[#F5F1EB] p-3">
        {/* Header */}
        <div className="mb-3">
          <h2 className="text-[16px] font-bold text-[#1B4332]" style={{ fontFamily: 'Georgia, serif' }}>
            {m.title}
          </h2>
          <div className="text-[11px] text-[#808080] flex gap-3 mt-1">
            <span>{m.date}</span>
            <span>Duration: {m.duration}</span>
            <span>Chair: {m.chair}</span>
          </div>
        </div>

        {/* Attendance */}
        <div className="mb-3">
          <div className="bracket-header">[■] ROLL CALL</div>
          <div className="flex gap-2 flex-wrap">
            {m.members.map((member) => (
              <div
                key={member.name}
                className={`px-2 py-1 rounded text-[10px] border ${
                  member.present
                    ? 'bg-[#E8F5E9] border-[#2D6A4F] text-[#1B4332]'
                    : 'bg-[#FFEBEE] border-[#C1292E] text-[#C1292E]'
                }`}
              >
                {member.name}
                {member.role === 'Chair' && ' (Chair)'}
                {!member.present && ' — absent'}
                {member.note && <span className="text-[9px] text-[#808080] ml-1">({member.note})</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Agenda */}
        <div className="mb-3">
          <div className="bracket-header">[&gt;] AGENDA</div>
          <div className="space-y-1">
            {m.agendaItems.map((item, i) => (
              <motion.div
                key={i}
                className={`border rounded cursor-pointer transition-colors ${
                  selectedItem === i ? 'border-[#2D6A4F] bg-white' : 'border-[#D4D7CD] bg-[#FAFAF5] hover:bg-white'
                }`}
                onClick={() => setSelectedItem(selectedItem === i ? null : i)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <span className="font-mono text-[10px] text-[#808080] w-8 shrink-0">#{item.num}</span>
                  <span className="flex-1 font-medium text-[11px]">{item.title}</span>

                  {/* Vote result */}
                  {item.vote && (
                    <VoteBadge
                      result={item.vote.result}
                      ayes={item.vote.ayes}
                      nays={item.vote.nays}
                    />
                  )}
                </div>

                {/* Expanded content */}
                {selectedItem === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="border-t border-[#D4D7CD] px-2 py-2 bg-white"
                  >
                    {item.summary && (
                      <p className="text-[11px] text-[#404040] mb-2">{item.summary}</p>
                    )}
                    {item.items && (
                      <ul className="list-none space-y-0.5 mb-2">
                        {item.items.map((sub, j) => (
                          <li key={j} className="text-[10px] text-[#606060]">
                            <span className="text-[#2D6A4F] mr-1">•</span> {sub}
                          </li>
                        ))}
                      </ul>
                    )}
                    {item.dissent && (
                      <div className="text-[10px] text-[#C1292E]">
                        Dissent: {item.dissent}
                      </div>
                    )}
                    {item.vote && (
                      <div className="mt-2">
                        <VoteRollCall members={m.members.filter(m => m.present)} nays={item.dissent ? [item.dissent] : []} />
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Public Comment */}
        <div>
          <div className="bracket-header">[◆] PUBLIC COMMENT ({m.publicCommenters.length})</div>
          <div className="space-y-2">
            {m.publicCommenters.map((commenter, i) => (
              <motion.div
                key={i}
                className="border border-[#D4D7CD] rounded bg-[#FAFAF5] px-2 py-1.5"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-[11px]">{commenter.name}</span>
                  <span className="text-[9px] text-[#808080]">Items {commenter.items}</span>
                  <span className={`text-[9px] px-1 rounded ${
                    commenter.stance === 'support' ? 'bg-[#E8F5E9] text-[#2D6A4F]' :
                    commenter.stance === 'oppose' ? 'bg-[#FFEBEE] text-[#C1292E]' :
                    'bg-[#FFF8E1] text-[#D4A017]'
                  }`}>
                    {commenter.stance}
                  </span>
                </div>
                <p className="text-[10px] text-[#606060] italic">&ldquo;{commenter.snippet}&rdquo;</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function VoteBadge({ result, ayes, nays }: { result: string; ayes: number; nays: number }) {
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
      result === 'Passed'
        ? 'bg-[#E8F5E9] text-[#2D6A4F] border border-[#2D6A4F]'
        : 'bg-[#FFEBEE] text-[#C1292E] border border-[#C1292E]'
    }`}>
      {result} {ayes}-{nays}
    </span>
  );
}

function VoteRollCall({ members, nays }: { members: { name: string }[]; nays: string[] }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {members.map((m, i) => {
        const isNay = nays.includes(m.name);
        return (
          <motion.div
            key={m.name}
            className={`px-2 py-0.5 text-[10px] font-mono border rounded ${
              isNay
                ? 'bg-[#FFEBEE] border-[#C1292E] text-[#C1292E]'
                : 'bg-[#E8F5E9] border-[#2D6A4F] text-[#2D6A4F]'
            }`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
          >
            {m.name}: {isNay ? 'NAY' : 'AYE'}
          </motion.div>
        );
      })}
    </div>
  );
}
