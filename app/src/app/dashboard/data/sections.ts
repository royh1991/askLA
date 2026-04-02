// Domain section configurations — 10 sections with colors and metadata

export interface Section {
  id: string
  title: string
  slug: string
  saturated: string
  pastel: string
  textOnSaturated: string
  description: string
  iconSubject: string
}

export const SECTIONS: Section[] = [
  {
    id: 'budget',
    title: 'Budget & Spending',
    slug: 'budget-spending',
    saturated: '#6C5CE7',
    pastel: '#E8E4F8',
    textOnSaturated: '#FFFFFF',
    description: "Where does LA's $13.2B go? Track every dollar from revenue source to department to vendor.",
    iconSubject: 'city hall with money flowing through departments',
  },
  {
    id: 'accountability',
    title: 'Accountability',
    slug: 'accountability',
    saturated: '#D63031',
    pastel: '#FDE8E8',
    textOnSaturated: '#FFFFFF',
    description: '8 forensic detection algorithms scan $7B in city spending for anomalies. Benford\'s Law, duplicate payments, split transactions, and shell company indicators.',
    iconSubject: 'magnifying glass over ledger with red flags',
  },
  {
    id: 'campaign',
    title: 'Campaign Finance',
    slug: 'campaign-finance',
    saturated: '#A855F7',
    pastel: '#F3E8FF',
    textOnSaturated: '#FFFFFF',
    description: '388K donations, 289K expenditures, and the overlap between who donates and who gets city contracts.',
    iconSubject: 'ballot box with dollar signs flowing in and out',
  },
  {
    id: 'policing',
    title: 'Policing & Justice',
    slug: 'policing-justice',
    saturated: '#1E3A5F',
    pastel: '#E0E8F0',
    textOnSaturated: '#FFFFFF',
    description: "LA's $2.14B police budget, RIPA stop data, and the gap between adopted budgets and actual spending.",
    iconSubject: 'police badge with courthouse',
  },
  {
    id: 'safety',
    title: 'Safety',
    slug: 'safety',
    saturated: '#E84855',
    pastel: '#FDE8EA',
    textOnSaturated: '#FFFFFF',
    description: '621K traffic collisions, Vision Zero failures, earthquake preparedness, and LAFD response times.',
    iconSubject: 'traffic light with ambulance',
  },
  {
    id: 'housing',
    title: 'Housing & Homelessness',
    slug: 'housing-homelessness',
    saturated: '#00B894',
    pastel: '#E0F8F1',
    textOnSaturated: '#FFFFFF',
    description: 'Where is LA building? Who gets $1.8B in homelessness funds? Will 13,277 buildings be retrofitted before the earthquake deadline?',
    iconSubject: 'apartment building with construction crane',
  },
  {
    id: 'people',
    title: 'People & Demographics',
    slug: 'people-demographics',
    saturated: '#0984E3',
    pastel: '#E0F0FF',
    textOnSaturated: '#FFFFFF',
    description: '10 million people across 2,498 census tracts. Income inequality, poverty rates, and who has access to what.',
    iconSubject: 'diverse community of people',
  },
  {
    id: 'health',
    title: 'Health & Environment',
    slug: 'health-environment',
    saturated: '#00CEC9',
    pastel: '#E0FFFE',
    textOnSaturated: '#FFFFFF',
    description: 'The most polluted census tracts have 3-8 percentage points higher rates of asthma, diabetes, and depression.',
    iconSubject: 'tree next to factory smokestacks',
  },
  {
    id: 'infrastructure',
    title: 'Infrastructure & Services',
    slug: 'infrastructure',
    saturated: '#FDCB6E',
    pastel: '#FFF8E7',
    textOnSaturated: '#1A1A1A',
    description: '34K parking meters, 1.5M 311 requests, and the physical fabric of Los Angeles.',
    iconSubject: 'road with parking meter and fire hydrant',
  },
  {
    id: 'governance',
    title: 'Governance & Legislation',
    slug: 'governance',
    saturated: '#636E72',
    pastel: '#F0F0F0',
    textOnSaturated: '#FFFFFF',
    description: '390 council files tracked, 10,698 meetings transcribed, 20.9M words of public discourse.',
    iconSubject: 'gavel with document stack',
  },
]

export const TICKER_FACTS = [
  'LAHSA received $1.42B in city grants',
  '621,677 traffic collisions since 2020',
  '388,645 campaign donations tracked',
  '13,277 buildings need retrofit by April 2026',
  'MV Transportation: $779M classified as "grants"',
  '67% soft-story compliance rate',
  '$46M in council discretionary funds',
  'Top-decile pollution tracts: 3-8pp higher asthma rates',
  '78 nonprofits where city grants exceed 50% of revenue',
  'LAPD budget: $2.14B adopted, overtime pushes it higher',
  '$384M in LAPD settlements, many with zero council discussion',
  '3M+ RIPA stops recorded by LAPD',
  '1.5M 311 requests filed by Angelenos',
  '$208M/yr in parking revenue from 34,245 meters',
  '10,698 council meetings transcribed since 2008',
  "Benford's Law flags anomalous patterns in 6 departments",
  '24.3M parking citations issued',
  '199,740 nonprofits registered in California',
  'Vision Zero failed: traffic fatalities up 60%',
  '2,714 grant recipients resolved to entity type',
]

export const TRENDING_QUESTIONS = [
  "Where does LA's $13.2B budget go?",
  "Do city payments follow Benford's Law?",
  'Has Vision Zero reduced traffic fatalities?',
  'Which nonprofits are 100% city-dependent?',
  'Is LAPD overtime an off-books budget expansion?',
  'Do polluted neighborhoods get less city investment?',
  'How much mansion tax revenue has Measure ULA generated?',
  'What do Angelenos complain about most on 311?',
]
