'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import meetingsData from '@/data/meetings.json';

interface Meeting {
  id: number;
  title: string;
  date: string;
  time: string;
  video: string | null;
  hasDocs: boolean;
  hasTranscript: boolean;
  hasAudio: boolean;
}

const meetings = meetingsData as Meeting[];

const COMMITTEE_COLORS: Record<string, string> = {
  'City Council': '#3168D5',
  'Planning': '#9C27B0',
  'Budget': '#2D6A4F',
  'Transportation': '#E65100',
  'Housing': '#C62828',
  'Public Safety': '#1565C0',
  'Arts': '#6A1B9A',
  'Health': '#00838F',
  'Energy': '#F9A825',
  'Trade': '#4E342E',
  'default': '#607D8B',
};

function getCommitteeColor(title: string): string {
  for (const [key, color] of Object.entries(COMMITTEE_COLORS)) {
    if (title.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return COMMITTEE_COLORS.default;
}

function getMonthName(month: number): string {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month];
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function MeetingCalendar() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(2); // March
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [filter, setFilter] = useState('');

  // Group meetings by date
  const meetingsByDate = useMemo(() => {
    const map: Record<string, Meeting[]> = {};
    for (const m of meetings) {
      if (!map[m.date]) map[m.date] = [];
      map[m.date].push(m);
    }
    return map;
  }, []);

  // Get meetings for selected month
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  // Filter meetings for list view
  const filteredMeetings = useMemo(() => {
    let filtered = meetings.filter(m => m.date.startsWith(monthStr));
    if (filter) {
      const f = filter.toLowerCase();
      filtered = filtered.filter(m => m.title.toLowerCase().includes(f));
    }
    return filtered;
  }, [monthStr, filter]);

  // Selected date meetings
  const selectedMeetings = selectedDate ? (meetingsByDate[selectedDate] || []) : [];

  // Stats for the month
  const monthMeetings = meetings.filter(m => m.date.startsWith(monthStr));
  const withVideo = monthMeetings.filter(m => m.video).length;
  const withDocs = monthMeetings.filter(m => m.hasDocs).length;

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  };

  return (
    <div className="h-full flex flex-col text-[11px]">
      {/* WinAmp-style toolbar */}
      <div style={{
        background: 'linear-gradient(180deg, #3A3A4A 0%, #2A2A3A 50%, #1A1A2A 100%)',
        borderBottom: '1px solid #555',
        padding: '3px 6px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        color: '#00FF00',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
      }}>
        <span style={{ color: '#8F8' }}>&#9654;</span>
        <span>LA CITY COUNCIL</span>
        <span style={{ color: '#888' }}>|</span>
        <span>{monthMeetings.length} meetings</span>
        <span style={{ color: '#888' }}>|</span>
        <span>{withVideo} with video</span>
        <span style={{ color: '#888' }}>|</span>
        <span>{withDocs} with docs</span>
        <div style={{ flex: 1 }} />
        {/* Fake EQ bars */}
        <div style={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: 12 }}>
          {[6, 10, 4, 8, 12, 5, 9, 3, 7, 11].map((h, i) => (
            <motion.div key={i}
              style={{ width: 2, background: '#0F0' }}
              animate={{ height: [h, 12 - h, h] }}
              transition={{ duration: 0.5 + i * 0.1, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>

      {/* Menu bar - XP style */}
      <div className="bg-[#ECF0F8] border-b border-[#B0C0D0] px-2 py-[2px] flex gap-4 items-center">
        <span className="hover:bg-[#3168D5] hover:text-white px-1 rounded cursor-pointer"><u>F</u>ile</span>
        <span className="hover:bg-[#3168D5] hover:text-white px-1 rounded cursor-pointer"><u>V</u>iew</span>
        <span className="hover:bg-[#3168D5] hover:text-white px-1 rounded cursor-pointer"><u>T</u>ools</span>
        <div className="flex-1" />
        <div className="flex gap-1">
          <button className={`xp-button text-[9px] !px-2 ${viewMode === 'calendar' ? '!bg-[#D0DDE9]' : ''}`}
            onClick={() => setViewMode('calendar')}>Calendar</button>
          <button className={`xp-button text-[9px] !px-2 ${viewMode === 'list' ? '!bg-[#D0DDE9]' : ''}`}
            onClick={() => setViewMode('list')}>List</button>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#F5F1EB] border-b border-[#D4D7CD]">
        <button className="xp-button text-[10px] !px-2" onClick={prevMonth}>&#9668;</button>
        <h2 className="text-[16px] font-bold text-[#1B4332] flex-1 text-center" style={{ fontFamily: 'Georgia, serif' }}>
          {getMonthName(month)} {year}
        </h2>
        <button className="xp-button text-[10px] !px-2" onClick={nextMonth}>&#9658;</button>
        <div className="w-px h-5 bg-[#D4D7CD]" />
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter..."
          className="px-2 py-1 border border-[#B0C0D0] rounded text-[10px] w-[120px] outline-none focus:border-[#3168D5]"
        />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'calendar' ? (
          <>
            {/* Calendar grid */}
            <div className="flex-1 overflow-auto p-2">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-[1px] mb-[1px]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-[10px] font-bold text-[#808080] py-1 bg-[#ECF0F8] rounded-t">{d}</div>
                ))}
              </div>

              {/* Date cells */}
              <div className="grid grid-cols-7 gap-[1px]">
                {/* Empty cells before first day */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[70px] bg-[#F0F0F0] rounded" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayMeetings = meetingsByDate[dateStr] || [];
                  const isSelected = selectedDate === dateStr;
                  const isToday = dateStr === '2026-03-28';

                  return (
                    <motion.div
                      key={day}
                      className={`min-h-[70px] rounded cursor-pointer border transition-colors ${
                        isSelected ? 'border-[#3168D5] bg-[#E3ECFC]' :
                        isToday ? 'border-[#2D6A4F] bg-[#F0FFF0]' :
                        dayMeetings.length > 0 ? 'border-[#E0E0E0] bg-white hover:bg-[#F5F8FF]' :
                        'border-[#F0F0F0] bg-[#FAFAFA]'
                      }`}
                      onClick={() => setSelectedDate(dateStr)}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="p-1">
                        <div className={`text-[10px] font-bold ${isToday ? 'text-[#2D6A4F]' : 'text-[#606060]'}`}>
                          {day}
                          {isToday && <span className="text-[8px] ml-1 text-[#2D6A4F]">TODAY</span>}
                        </div>
                        {dayMeetings.slice(0, 3).map((m, j) => (
                          <div key={j} className="mt-0.5 px-1 py-[1px] rounded text-[8px] truncate text-white"
                            style={{ background: getCommitteeColor(m.title) }}>
                            {m.title.replace('City Council ', '').replace('Committee', 'Cmte').replace('Meeting', 'Mtg').substring(0, 25)}
                          </div>
                        ))}
                        {dayMeetings.length > 3 && (
                          <div className="text-[8px] text-[#808080] mt-0.5">+{dayMeetings.length - 3} more</div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Side panel — selected date details */}
            <div className="w-[240px] border-l border-[#B0C0D0] bg-white overflow-auto shrink-0">
              <AnimatePresence mode="wait">
                {selectedDate && selectedMeetings.length > 0 ? (
                  <motion.div key={selectedDate} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3">
                    <div className="text-[13px] font-bold text-[#1B4332] mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                      {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="text-[10px] text-[#808080] mb-3">{selectedMeetings.length} meeting{selectedMeetings.length > 1 ? 's' : ''}</div>

                    {selectedMeetings.map((m) => (
                      <div key={m.id} className="border border-[#D4D7CD] rounded p-2 mb-2 bg-[#FAFAF5]">
                        <div className="flex items-start gap-1.5">
                          <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: getCommitteeColor(m.title) }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-bold text-[#1A1A1A] leading-[14px]">{m.title}</div>
                            <div className="text-[10px] text-[#808080] mt-0.5">
                              {m.time && <span>{m.time} · </span>}
                              <span className="font-mono">m{m.id}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status badges */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {m.video && (
                            <span className="text-[8px] px-1.5 py-[1px] rounded bg-[#E8F5E9] text-[#2D6A4F] border border-[#A5D6A7]">
                              ▶ Video
                            </span>
                          )}
                          {m.hasDocs && (
                            <span className="text-[8px] px-1.5 py-[1px] rounded bg-[#E3F2FD] text-[#1565C0] border border-[#90CAF9]">
                              📄 Docs
                            </span>
                          )}
                          {m.hasTranscript && (
                            <span className="text-[8px] px-1.5 py-[1px] rounded bg-[#FFF3E0] text-[#E65100] border border-[#FFCC80]">
                              📝 Transcript
                            </span>
                          )}
                          {m.hasAudio && (
                            <span className="text-[8px] px-1.5 py-[1px] rounded bg-[#F3E5F5] text-[#6A1B9A] border border-[#CE93D8]">
                              🎙 Audio
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-1 mt-2">
                          {m.video && (
                            <a href={`https://youtube.com/watch?v=${m.video}`} target="_blank" rel="noreferrer"
                              className="xp-button text-[9px] !px-2">Watch</a>
                          )}
                          <button className="xp-button text-[9px] !px-2">Details</button>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="p-3 text-center text-[11px] text-[#808080] mt-8">
                    <div className="text-[32px] mb-2">📅</div>
                    <p className="font-bold text-[#1A1A1A] mb-1">Select a date</p>
                    <p className="leading-[15px]">Click any date on the calendar to see meetings scheduled for that day.</p>
                    <div className="mt-4 text-[9px] text-left space-y-1">
                      <div className="bracket-header text-[9px]">[■] LEGEND</div>
                      {Object.entries(COMMITTEE_COLORS).filter(([k]) => k !== 'default').map(([name, color]) => (
                        <div key={name} className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
                          <span>{name}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          /* List view */
          <div className="flex-1 overflow-auto">
            <table className="w-full text-[10px]">
              <thead className="bg-[#ECF0F8] sticky top-0">
                <tr>
                  <th className="text-left px-2 py-1 border-b border-[#B0C0D0]">Date</th>
                  <th className="text-left px-2 py-1 border-b border-[#B0C0D0]">Time</th>
                  <th className="text-left px-2 py-1 border-b border-[#B0C0D0]">Meeting</th>
                  <th className="text-center px-2 py-1 border-b border-[#B0C0D0]">Video</th>
                  <th className="text-center px-2 py-1 border-b border-[#B0C0D0]">Docs</th>
                  <th className="text-left px-2 py-1 border-b border-[#B0C0D0]">ID</th>
                </tr>
              </thead>
              <tbody>
                {filteredMeetings.map((m) => (
                  <tr key={m.id} className="hover:bg-[#F5F8FF] cursor-pointer border-b border-[#F0F0F0]">
                    <td className="px-2 py-1.5 font-mono whitespace-nowrap">{m.date}</td>
                    <td className="px-2 py-1.5 text-[#808080]">{m.time || '—'}</td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: getCommitteeColor(m.title) }} />
                        <span className="truncate max-w-[250px]">{m.title}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-center">{m.video ? '▶' : '—'}</td>
                    <td className="px-2 py-1.5 text-center">{m.hasDocs ? '📄' : '—'}</td>
                    <td className="px-2 py-1.5 font-mono text-[#808080]">m{m.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status bar - retro style */}
      <div style={{
        background: 'linear-gradient(180deg, #3A3A4A 0%, #2A2A3A 100%)',
        borderTop: '1px solid #555',
        padding: '2px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        color: '#0F0',
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
      }}>
        <span>MEETINGS: {monthMeetings.length}</span>
        <span style={{ color: '#888' }}>|</span>
        <span>INDEXED: 7,427 total (2008-2026)</span>
        <span style={{ color: '#888' }}>|</span>
        <span>SRC: manifest.json</span>
        <div style={{ flex: 1 }} />
        <span style={{ color: '#8F8' }}>● ONLINE</span>
      </div>
    </div>
  );
}
