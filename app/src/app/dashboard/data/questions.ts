// All 95 question definitions with mock data, organized by section

export type ChartType =
  | 'sankey' | 'hbar' | 'vbar' | 'stacked-bar' | 'grouped-bar'
  | 'line' | 'area' | 'sparkline'
  | 'donut' | 'treemap' | 'scatter' | 'gauge' | 'heat-grid'
  | 'histogram' | 'table' | 'stat' | 'funnel' | 'timeline'

export interface Question {
  id: string
  sectionId: string
  question: string
  dataSource: string
  chartType: ChartType
  heroNumber: string | null
  heroLabel?: string
  sourceLabel?: string
}

// ─── BUDGET & SPENDING ──────────────────────────────
const budget: Question[] = [
  { id: 'b1', sectionId: 'budget', question: "Where does LA's $13.2B budget go?", dataSource: 'city_budget', chartType: 'sankey', heroNumber: '$13.2B', heroLabel: 'total adopted budget' },
  { id: 'b2', sectionId: 'budget', question: 'Who are the top recipients of city grants?', dataSource: 'checkbook_transactions + entities', chartType: 'hbar', heroNumber: '$7.0B', heroLabel: 'in grant payments' },
  { id: 'b3', sectionId: 'budget', question: 'How much does each department spend?', dataSource: 'city_budget', chartType: 'stacked-bar', heroNumber: '$13.2B' },
  { id: 'b4', sectionId: 'budget', question: 'How much do council members control in discretionary funds?', dataSource: 'discretionary_spending', chartType: 'grouped-bar', heroNumber: '$46M' },
  { id: 'b5', sectionId: 'budget', question: 'Which council districts get the most discretionary money?', dataSource: 'discretionary_spending', chartType: 'hbar', heroNumber: '$46M' },
  { id: 'b6', sectionId: 'budget', question: 'Who receives discretionary fund grants?', dataSource: 'discretionary_spending', chartType: 'treemap', heroNumber: '$46M' },
  { id: 'b7', sectionId: 'budget', question: 'How has the city budget grown over time?', dataSource: 'city_budget', chartType: 'area', heroNumber: '$13.2B' },
  { id: 'b8', sectionId: 'budget', question: "What's the breakdown of city revenue sources?", dataSource: 'city_budget', chartType: 'donut', heroNumber: null },
  { id: 'b9', sectionId: 'budget', question: 'How much does the city spend on homelessness programs?', dataSource: 'homelessness_spending', chartType: 'stacked-bar', heroNumber: '$1.8B' },
  { id: 'b10', sectionId: 'budget', question: 'Which vendors dominate city spending by department?', dataSource: 'checkbook_transactions', chartType: 'hbar', heroNumber: null, heroLabel: 'HHI concentration analysis' },
]

// ─── ACCOUNTABILITY & FORENSICS ─────────────────────
const accountability: Question[] = [
  { id: 'a1', sectionId: 'accountability', question: "Do city payments follow Benford's Law?", dataSource: 'checkbook_transactions (forensics)', chartType: 'grouped-bar', heroNumber: null, heroLabel: 'first-digit distribution' },
  { id: 'a2', sectionId: 'accountability', question: 'How many duplicate payments has the city made?', dataSource: 'checkbook_transactions (forensics)', chartType: 'table', heroNumber: null },
  { id: 'a3', sectionId: 'accountability', question: 'Are vendors splitting invoices to stay under approval thresholds?', dataSource: 'checkbook_transactions (forensics)', chartType: 'histogram', heroNumber: null },
  { id: 'a4', sectionId: 'accountability', question: 'Does the city spend more at the end of fiscal years?', dataSource: 'checkbook_transactions (forensics)', chartType: 'line', heroNumber: null, heroLabel: 'use-it-or-lose-it' },
  { id: 'a5', sectionId: 'accountability', question: 'Which vendors got big payments but few transactions?', dataSource: 'checkbook_transactions (forensics)', chartType: 'scatter', heroNumber: null },
  { id: 'a6', sectionId: 'accountability', question: 'Do multiple vendors share the same zip code?', dataSource: 'checkbook_transactions (forensics)', chartType: 'table', heroNumber: null },
  { id: 'a7', sectionId: 'accountability', question: 'Which nonprofits receive more city money than their annual revenue?', dataSource: 'entities + irs_bmf', chartType: 'scatter', heroNumber: '78', heroLabel: 'city-dependent nonprofits' },
  { id: 'a8', sectionId: 'accountability', question: 'Is the city paying dissolved nonprofits?', dataSource: 'entities + irs_bmf + checkbook_transactions', chartType: 'table', heroNumber: null },
  { id: 'a9', sectionId: 'accountability', question: 'What\'s the "Money Triangle"? Who lobbies, donates, AND gets contracts?', dataSource: 'entities + campaign_contributions + lobbying_payments', chartType: 'table', heroNumber: null, heroLabel: 'influence pipeline' },
  { id: 'a10', sectionId: 'accountability', question: 'How much did MV Transportation really get?', dataSource: 'checkbook_transactions + lobbying_projects + entities', chartType: 'line', heroNumber: '$779M', heroLabel: 'classified as "grants"' },
]

// ─── CAMPAIGN FINANCE ───────────────────────────────
const campaign: Question[] = [
  { id: 'c1', sectionId: 'campaign', question: 'How much money flows into LA city campaigns?', dataSource: 'campaign_contributions', chartType: 'area', heroNumber: '$88.2M' },
  { id: 'c2', sectionId: 'campaign', question: 'Who are the biggest donors to LA campaigns?', dataSource: 'campaign_contributions', chartType: 'hbar', heroNumber: null },
  { id: 'c3', sectionId: 'campaign', question: 'Which candidates raise the most money?', dataSource: 'campaign_contributions', chartType: 'hbar', heroNumber: null },
  { id: 'c4', sectionId: 'campaign', question: 'How are campaign funds spent?', dataSource: 'campaign_expenditures', chartType: 'treemap', heroNumber: '$71.4M' },
  { id: 'c5', sectionId: 'campaign', question: 'Do campaign donors get city contracts?', dataSource: 'campaign_contributions + entities', chartType: 'table', heroNumber: null },
  { id: 'c6', sectionId: 'campaign', question: 'Do organizations that donate also hire lobbyists?', dataSource: 'campaign_contributions + lobbying_payments', chartType: 'table', heroNumber: null },
  { id: 'c7', sectionId: 'campaign', question: 'Do discretionary fund recipients donate to their council member?', dataSource: 'discretionary_spending + campaign_contributions', chartType: 'scatter', heroNumber: null },
  { id: 'c8', sectionId: 'campaign', question: 'What does the lobbying-to-spending pipeline look like?', dataSource: 'lobbying_payments + lobbying_projects + checkbook_transactions', chartType: 'sankey', heroNumber: '$175M' },
  { id: 'c9', sectionId: 'campaign', question: 'Which departments are most heavily lobbied?', dataSource: 'lobbying_projects', chartType: 'hbar', heroNumber: '234K', heroLabel: 'lobbying projects' },
  { id: 'c10', sectionId: 'campaign', question: 'How much do lobbying firms charge their clients?', dataSource: 'lobbying_payments', chartType: 'grouped-bar', heroNumber: '$175M' },
]

// ─── POLICING & JUSTICE ─────────────────────────────
const policing: Question[] = [
  { id: 'p1', sectionId: 'policing', question: 'How much does LA really spend on policing?', dataSource: 'city_budget + checkbook_transactions', chartType: 'stacked-bar', heroNumber: '$2.14B' },
  { id: 'p2', sectionId: 'policing', question: 'Is LAPD overtime an off-books budget expansion?', dataSource: 'checkbook_transactions (POLICE dept)', chartType: 'line', heroNumber: null },
  { id: 'p3', sectionId: 'policing', question: 'How much has LA paid in police settlements?', dataSource: 'council_files + meeting transcripts', chartType: 'vbar', heroNumber: '$384M' },
  { id: 'p4', sectionId: 'policing', question: 'How many people are stopped by LAPD, and who?', dataSource: 'RIPA Stops', chartType: 'stacked-bar', heroNumber: '3M+', heroLabel: 'RIPA stops' },
  { id: 'p5', sectionId: 'policing', question: 'What does LAPD arrest data show?', dataSource: 'Arrests', chartType: 'line', heroNumber: null },
  { id: 'p6', sectionId: 'policing', question: 'How many calls for service does LAPD handle?', dataSource: 'LAPD Calls', chartType: 'area', heroNumber: null },
  { id: 'p7', sectionId: 'policing', question: 'What are the trends in custodial deaths?', dataSource: 'deaths_in_custody', chartType: 'stacked-bar', heroNumber: '320' },
  { id: 'p8', sectionId: 'policing', question: 'Which agencies have the most custodial deaths?', dataSource: 'deaths_in_custody', chartType: 'hbar', heroNumber: null },
  { id: 'p9', sectionId: 'policing', question: 'Are custodial deaths disproportionate by race?', dataSource: 'deaths_in_custody', chartType: 'grouped-bar', heroNumber: null },
  { id: 'p10', sectionId: 'policing', question: 'How does LAPD spending compare to other departments?', dataSource: 'city_budget', chartType: 'donut', heroNumber: null },
]

// ─── SAFETY ─────────────────────────────────────────
const safety: Question[] = [
  { id: 's1', sectionId: 'safety', question: 'How many traffic collisions happen in LA each year?', dataSource: 'traffic_collisions', chartType: 'line', heroNumber: '621K', sourceLabel: 'LAPD' },
  { id: 's2', sectionId: 'safety', question: 'Has Vision Zero reduced traffic fatalities?', dataSource: 'traffic_collisions', chartType: 'line', heroNumber: '+60%', heroLabel: 'fatalities increased' },
  { id: 's3', sectionId: 'safety', question: 'Which neighborhoods have the most collisions?', dataSource: 'traffic_collisions', chartType: 'hbar', heroNumber: null },
  { id: 's4', sectionId: 'safety', question: 'Who are the victims of traffic collisions?', dataSource: 'traffic_collisions', chartType: 'grouped-bar', heroNumber: null },
  { id: 's5', sectionId: 'safety', question: 'Where do pedestrian fatalities happen?', dataSource: 'traffic_collisions', chartType: 'hbar', heroNumber: null },
  { id: 's6', sectionId: 'safety', question: 'How many earthquakes hit near LA?', dataSource: 'earthquakes', chartType: 'scatter', heroNumber: '188', sourceLabel: 'USGS' },
  { id: 's7', sectionId: 'safety', question: 'Are soft-story buildings ready for the next earthquake?', dataSource: 'soft_story_permits + calenviroscreen', chartType: 'gauge', heroNumber: '13,277', heroLabel: 'unreinforced buildings' },
  { id: 's8', sectionId: 'safety', question: 'How fast does LAFD respond?', dataSource: 'LAFD Response', chartType: 'histogram', heroNumber: null },
]

// ─── HOUSING & HOMELESSNESS ─────────────────────────
const housing: Question[] = [
  { id: 'h1', sectionId: 'housing', question: 'Where is new housing being built?', dataSource: 'building_permits', chartType: 'vbar', heroNumber: '25,715' },
  { id: 'h2', sectionId: 'housing', question: 'What types of housing are being built?', dataSource: 'building_permits', chartType: 'stacked-bar', heroNumber: null },
  { id: 'h3', sectionId: 'housing', question: 'How much mansion tax revenue has Measure ULA generated?', dataSource: 'ula_revenue', chartType: 'area', heroNumber: '$312M' },
  { id: 'h4', sectionId: 'housing', question: 'Which council districts generate the most ULA revenue?', dataSource: 'ula_revenue', chartType: 'hbar', heroNumber: null },
  { id: 'h5', sectionId: 'housing', question: 'How many buildings need earthquake retrofit?', dataSource: 'soft_story_permits', chartType: 'gauge', heroNumber: '67%', heroLabel: 'compliance rate' },
  { id: 'h6', sectionId: 'housing', question: 'Where are the unreinforced buildings?', dataSource: 'soft_story_permits', chartType: 'hbar', heroNumber: '13,277' },
  { id: 'h7', sectionId: 'housing', question: 'Where does $1.8B in homelessness spending go?', dataSource: 'homelessness_spending', chartType: 'treemap', heroNumber: '$1.8B' },
  { id: 'h8', sectionId: 'housing', question: 'Does the Abundant Blessings pattern repeat?', dataSource: 'homelessness_spending + entities + irs_bmf', chartType: 'table', heroNumber: null, heroLabel: 'multi-layered grant fraud' },
  { id: 'h9', sectionId: 'housing', question: 'Which homelessness vendors have the highest overhead?', dataSource: 'entities + irs_bmf', chartType: 'scatter', heroNumber: null },
  { id: 'h10', sectionId: 'housing', question: 'How many rent-stabilized units exist?', dataSource: 'Rent Stabilization', chartType: 'vbar', heroNumber: null },
  { id: 'h11', sectionId: 'housing', question: 'How many eviction notices are filed?', dataSource: 'Eviction Notices', chartType: 'line', heroNumber: null },
  { id: 'h12', sectionId: 'housing', question: 'Where is affordable housing being built?', dataSource: 'Affordable Housing', chartType: 'hbar', heroNumber: null },
]

// ─── PEOPLE & DEMOGRAPHICS ──────────────────────────
const people: Question[] = [
  { id: 'pe1', sectionId: 'people', question: 'What does LA County look like demographically?', dataSource: 'census_acs_tracts', chartType: 'stacked-bar', heroNumber: '10.0M', heroLabel: 'residents' },
  { id: 'pe2', sectionId: 'people', question: "What's the income distribution across LA?", dataSource: 'census_acs_tracts', chartType: 'histogram', heroNumber: null },
  { id: 'pe3', sectionId: 'people', question: 'Where are the highest-poverty neighborhoods?', dataSource: 'census_acs_tracts', chartType: 'hbar', heroNumber: null },
  { id: 'pe4', sectionId: 'people', question: 'Which communities lack vehicle access?', dataSource: 'census_acs_tracts', chartType: 'hbar', heroNumber: null },
  { id: 'pe5', sectionId: 'people', question: 'How does income vary by race in LA?', dataSource: 'census_acs_tracts', chartType: 'grouped-bar', heroNumber: null },
  { id: 'pe6', sectionId: 'people', question: 'Where do non-English speakers live?', dataSource: 'census_acs_tracts', chartType: 'heat-grid', heroNumber: null },
]

// ─── HEALTH & ENVIRONMENT ───────────────────────────
const health: Question[] = [
  { id: 'he1', sectionId: 'health', question: 'Do polluted neighborhoods have worse health outcomes?', dataSource: 'calenviroscreen + cdc_places + census_acs_tracts', chartType: 'line', heroNumber: 'YES', heroLabel: '3-8pp higher asthma/diabetes' },
  { id: 'he2', sectionId: 'health', question: 'Which census tracts have the worst environmental burden?', dataSource: 'calenviroscreen', chartType: 'hbar', heroNumber: '8,035', heroLabel: 'tracts scored' },
  { id: 'he3', sectionId: 'health', question: 'What are the asthma rates across LA?', dataSource: 'cdc_places', chartType: 'heat-grid', heroNumber: null },
  { id: 'he4', sectionId: 'health', question: 'How do diabetes rates correlate with poverty?', dataSource: 'cdc_places + census_acs_tracts', chartType: 'scatter', heroNumber: null },
  { id: 'he5', sectionId: 'health', question: 'Where is air pollution worst?', dataSource: 'calenviroscreen', chartType: 'vbar', heroNumber: null },
  { id: 'he6', sectionId: 'health', question: 'Does the city invest less in polluted neighborhoods?', dataSource: 'calenviroscreen + checkbook_transactions', chartType: 'scatter', heroNumber: null },
  { id: 'he7', sectionId: 'health', question: 'Does council spending on fentanyl/overdose match the rhetoric?', dataSource: 'checkbook_transactions + cdc_places', chartType: 'line', heroNumber: null },
  { id: 'he8', sectionId: 'health', question: "What are LA's water supply sources?", dataSource: 'DWP Water Supply', chartType: 'stacked-bar', heroNumber: null },
  { id: 'he9', sectionId: 'health', question: 'How often do power outages happen?', dataSource: 'DWP Power Outages', chartType: 'line', heroNumber: null },
]

// ─── INFRASTRUCTURE & SERVICES ──────────────────────
const infrastructure: Question[] = [
  { id: 'i1', sectionId: 'infrastructure', question: 'How many parking meters does LA have?', dataSource: 'parking_meters', chartType: 'donut', heroNumber: '34,245' },
  { id: 'i2', sectionId: 'infrastructure', question: 'How much parking revenue does LA collect?', dataSource: 'parking_meters + parking citations', chartType: 'stacked-bar', heroNumber: '$208M/yr' },
  { id: 'i3', sectionId: 'infrastructure', question: 'What do Angelenos complain about most?', dataSource: 'MyLA311', chartType: 'hbar', heroNumber: '1.5M', heroLabel: '311 requests' },
  { id: 'i4', sectionId: 'infrastructure', question: 'Which neighborhoods file the most 311 requests?', dataSource: 'MyLA311', chartType: 'heat-grid', heroNumber: null },
  { id: 'i5', sectionId: 'infrastructure', question: 'How fast does the city respond to 311 requests?', dataSource: 'MyLA311', chartType: 'histogram', heroNumber: null },
  { id: 'i6', sectionId: 'infrastructure', question: "Where are LA's historic preservation zones?", dataSource: 'hpoz_boundaries', chartType: 'stat', heroNumber: '35', heroLabel: 'HPOZs' },
  { id: 'i7', sectionId: 'infrastructure', question: 'How many cultural facilities does LA maintain?', dataSource: 'cultural_facilities', chartType: 'stat', heroNumber: '30', heroLabel: 'DCA venues' },
  { id: 'i8', sectionId: 'infrastructure', question: 'What are Business Improvement Districts?', dataSource: 'bid_boundaries', chartType: 'stat', heroNumber: '42', heroLabel: 'BIDs, $65M/yr' },
  { id: 'i9', sectionId: 'infrastructure', question: 'How many parking citations are issued?', dataSource: 'Parking Citations', chartType: 'line', heroNumber: '24.3M' },
  { id: 'i10', sectionId: 'infrastructure', question: 'How many active businesses operate in LA?', dataSource: 'Active Businesses', chartType: 'area', heroNumber: null },
]

// ─── GOVERNANCE & LEGISLATION ───────────────────────
const governance: Question[] = [
  { id: 'g1', sectionId: 'governance', question: 'What legislation is the council working on?', dataSource: 'council_files', chartType: 'timeline', heroNumber: '390', heroLabel: 'council files' },
  { id: 'g2', sectionId: 'governance', question: 'How many council meetings happen each year?', dataSource: 'meeting metadata', chartType: 'vbar', heroNumber: '10,698' },
  { id: 'g3', sectionId: 'governance', question: 'Which topics dominate council discussions?', dataSource: 'meeting transcripts', chartType: 'hbar', heroNumber: '20.9M', heroLabel: 'words transcribed' },
  { id: 'g4', sectionId: 'governance', question: 'How much time does council spend on settlements?', dataSource: 'council_files + transcripts', chartType: 'scatter', heroNumber: '$384M' },
  { id: 'g5', sectionId: 'governance', question: 'How many nonprofits operate in California?', dataSource: 'irs_bmf', chartType: 'donut', heroNumber: '199K' },
  { id: 'g6', sectionId: 'governance', question: 'Which nonprofits have the most revenue?', dataSource: 'irs_bmf', chartType: 'hbar', heroNumber: null },
  { id: 'g7', sectionId: 'governance', question: 'What types of entities receive city money?', dataSource: 'entities', chartType: 'donut', heroNumber: '2,714' },
  { id: 'g8', sectionId: 'governance', question: 'How were 2,714 grant recipients identified?', dataSource: 'entities', chartType: 'funnel', heroNumber: '100%', heroLabel: 'resolved' },
  { id: 'g9', sectionId: 'governance', question: 'What federal grants does LA receive?', dataSource: 'USASpending data', chartType: 'hbar', heroNumber: null },
  { id: 'g10', sectionId: 'governance', question: 'How much city payroll costs taxpayers?', dataSource: 'Payroll', chartType: 'stacked-bar', heroNumber: null, heroLabel: '686K records' },
]

// ─── Export all ──────────────────────────────────────
export const ALL_QUESTIONS: Question[] = [
  ...budget, ...accountability, ...campaign, ...policing, ...safety,
  ...housing, ...people, ...health, ...infrastructure, ...governance,
]

export function getQuestionsBySection(sectionId: string): Question[] {
  return ALL_QUESTIONS.filter(q => q.sectionId === sectionId)
}
