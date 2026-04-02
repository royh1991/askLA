'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { Question } from '../data/questions'
import { LineChart, HBarChart, VBarChart, DonutChart, Treemap, ScatterPlot, Gauge, HeatGrid, SankeyDiagram, TableChart, StatCard, Timeline, FunnelChart } from '../charts'

interface AnswerViewProps {
  question: Question
  accentColor: string
  onClose: () => void
}

export function AnswerView({ question, accentColor, onClose }: AnswerViewProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const queryMap: Record<string, string> = {
      b1: 'budget-by-dept', b2: 'top-vendors', b3: 'budget-by-dept',
      b4: 'discretionary-by-district', b5: 'discretionary-by-district',
      b7: 'budget-by-year', b9: 'homelessness-by-vendor',
      c1: 'donations-by-year', c2: 'top-donors', c4: 'expenditures-by-type',
      c9: 'lobbying-by-dept', c10: 'lobbying-top-clients',
      s1: 'collisions-by-year', s3: 'collisions-by-area', s6: 'earthquakes',
      p7: 'deaths-by-year',
      h1: 'permits-by-year', h3: 'ula-revenue', h7: 'homelessness-by-vendor',
      h5: 'soft-story-status',
      pe1: 'demographics',
      he1: 'enviro-by-decile',
      g1: 'council-files-by-month', g5: 'nonprofits-by-ntee', g7: 'entity-types',
    }
    const apiQuery = queryMap[question.id]
    if (apiQuery) {
      fetch(`/api/data?q=${apiQuery}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.rows) setData(d); setLoading(false) })
        .catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [question.id])

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      style={{ overflow: 'hidden' }}
    >
      <div style={{ background: '#FFFFFF', border: '3px solid #1A1A1A', borderTop: 'none', padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 10, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' as const, color: '#9CA3AF', marginBottom: 8 }}>
              {question.dataSource.replace(/[`]/g, '')}
            </div>
            <h3 style={{ fontFamily: 'var(--font-display), sans-serif', fontSize: 28, fontWeight: 800, color: '#1A1A1A', lineHeight: 1.2, margin: 0 }}>
              {question.question}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: '2px solid #1A1A1A', padding: '8px 16px', fontFamily: 'var(--font-body), sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 8 }}>
            Close
          </button>
        </div>

        {question.heroNumber && (
          <div style={{ display: 'flex', gap: 48, marginBottom: 32 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: 56, fontWeight: 700, color: '#1A1A1A', lineHeight: 1 }}>
                {question.heroNumber}
              </div>
              {question.heroLabel && (
                <div style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 16, color: '#6B7280', marginTop: 4 }}>
                  {question.heroLabel}
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          {loading ? (
            <div style={{ background: '#F5F5F0', padding: 48, textAlign: 'center', fontFamily: 'var(--font-mono), monospace', fontSize: 13, color: '#9CA3AF' }}>
              Loading data...
            </div>
          ) : (
            <QuestionChart question={question} data={data} color={accentColor} />
          )}
        </div>

        {question.sourceLabel && (
          <div style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 13, color: '#9CA3AF', borderTop: '1px solid #F0F0F0', paddingTop: 16 }}>
            Source: {question.sourceLabel} &rarr;
          </div>
        )}
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   Question-specific chart rendering — every question gets
   realistic mock data tailored to its topic
   ═══════════════════════════════════════════════════════ */

function QuestionChart({ question, data, color }: { question: Question; data: any; color: string }) {
  const rows = data?.rows || []
  const q = question.id
  const src = question.dataSource.replace(/[`]/g, '')

  // ─── Try real API data first ──────────────────────
  if (rows.length > 0) {
    if (['hbar'].includes(question.chartType)) {
      return <HBarChart data={rows.slice(0, 12).map((r: any) => ({
        label: (r.vendor_name || r.department_name || r.con_name || r.area_name || r.client_name || r.department_lobbied || 'Unknown').slice(0, 28),
        value: parseFloat(r.total || r.projects || r.total_received || r.count || 0),
      }))} color={color} source={src} />
    }
    if (['line', 'area'].includes(question.chartType)) {
      return <LineChart data={rows.map((r: any) => ({
        x: String(r.year || r.fiscal_year || ''), y: parseFloat(r.total || r.count || r.avg_health_burden || 0),
      }))} color={color} areaFill={question.chartType === 'area'} source={src} />
    }
    if (['donut'].includes(question.chartType)) {
      return <DonutChart data={rows.slice(0, 8).map((r: any) => ({
        label: (r.entity_type || r.category || r.status || 'Other').slice(0, 20),
        value: parseFloat(r.count || r.total || r.total_received || r.total_revenue || 0),
      }))} source={src} />
    }
  }

  // ─── Question-specific mock data ──────────────────
  // BUDGET
  if (q === 'b1') return <SankeyDiagram title="LA City Budget — Revenue to Spending" leftLabel="Revenue" rightLabel="Spending" leftColor="#0984E3" rightColor="#6C5CE7" source="City Budget" leftNodes={[{id:'prop',label:'Property Tax',value:2800},{id:'sales',label:'Sales Tax',value:1100},{id:'util',label:'Utility Tax',value:680},{id:'biz',label:'Business Tax',value:890},{id:'fed',label:'Federal Grants',value:1200},{id:'other',label:'Other',value:2520}]} rightNodes={[{id:'lapd',label:'LAPD',value:3400},{id:'lafd',label:'LAFD',value:980},{id:'pw',label:'Public Works',value:1100},{id:'hless',label:'Homelessness',value:1800},{id:'other2',label:'All Other',value:3910}]} links={[{source:'prop',target:'lapd',value:1400},{source:'prop',target:'lafd',value:600},{source:'prop',target:'pw',value:800},{source:'sales',target:'lapd',value:500},{source:'sales',target:'other2',value:600},{source:'util',target:'lapd',value:400},{source:'util',target:'other2',value:280},{source:'biz',target:'lapd',value:400},{source:'biz',target:'pw',value:300},{source:'biz',target:'other2',value:190},{source:'fed',target:'hless',value:800},{source:'fed',target:'other2',value:400},{source:'other',target:'hless',value:1000},{source:'other',target:'lapd',value:700},{source:'other',target:'other2',value:820}]} />
  if (q === 'b2') return <HBarChart data={[{label:'LAHSA',value:1420000000},{label:'MV Transportation',value:779000000},{label:'LA Metro',value:320000000},{label:'PATH',value:82000000},{label:'LA Family Housing',value:65000000},{label:'LADWP Transfer',value:280000000},{label:'Brilliant Corners',value:48000000},{label:'The People Concern',value:42000000}]} color={color} source="Checkbook LA" formatValue={(v) => v >= 1e9 ? `$${(v/1e9).toFixed(1)}B` : `$${(v/1e6).toFixed(0)}M`} />
  if (q === 'b3') return <HBarChart data={[{label:'Police',value:3400},{label:'Homelessness',value:1800},{label:'Public Works',value:1100},{label:'Fire',value:980},{label:'Transportation',value:520},{label:'Housing & Community',value:450},{label:'Rec & Parks',value:380},{label:'DWP Transfer',value:280}]} color={color} source="City Budget" title="Department Spending ($M)" formatValue={v=>`$${v}M`} />
  if (q === 'b4') return <VBarChart data={[{label:'CD1',value:3.2},{label:'CD2',value:4.1},{label:'CD3',value:2.8},{label:'CD4',value:3.5},{label:'CD5',value:4.8},{label:'CD6',value:2.1},{label:'CD7',value:3.9},{label:'CD8',value:2.6},{label:'CD9',value:4.3},{label:'CD10',value:3.1},{label:'CD11',value:2.4},{label:'CD12',value:3.7},{label:'CD13',value:4.0},{label:'CD14',value:2.9},{label:'CD15',value:3.3}]} color={color} source="Discretionary Spending" title="Discretionary Funds by Council District ($M)" />
  if (q === 'b5') return <HBarChart data={[{label:'District 5',value:4800000},{label:'District 9',value:4300000},{label:'District 2',value:4100000},{label:'District 13',value:4000000},{label:'District 7',value:3900000},{label:'District 12',value:3700000},{label:'District 4',value:3500000},{label:'District 15',value:3300000}]} color={color} source="Discretionary Spending" />
  if (q === 'b6') return <Treemap data={[{label:'Youth Programs',value:8200000},{label:'Community Orgs',value:6100000},{label:'Street Improvements',value:5400000},{label:'Parks & Recreation',value:4800000},{label:'Public Safety',value:3200000},{label:'Senior Services',value:2100000},{label:'Arts & Culture',value:1800000},{label:'Other',value:4400000}]} colors={['#6C5CE7','#7C6CF7','#8C7CF7','#9C8CF7','#AC9CF7','#BCACF7','#CCBCF7','#DCCCF7']} source="Discretionary Spending" />
  if (q === 'b7') return <LineChart data={[{x:'FY18',y:9.2},{x:'FY19',y:10.1},{x:'FY20',y:10.5},{x:'FY21',y:10.8},{x:'FY22',y:11.4},{x:'FY23',y:12.1},{x:'FY24',y:12.8},{x:'FY25',y:13.2}]} color={color} yLabel="Billions ($)" source="City Budget" title="Total Adopted Budget Over Time ($B)" />
  if (q === 'b8') return <DonutChart data={[{label:'General Fund',value:7200},{label:'Special Funds',value:3100},{label:'Enterprise Funds',value:1800},{label:'Trust Funds',value:1100}]} centerValue="$13.2B" centerLabel="total" source="City Budget" />
  if (q === 'b9') return <LineChart data={[{x:'FY19',y:480},{x:'FY20',y:620},{x:'FY21',y:780},{x:'FY22',y:1100},{x:'FY23',y:1400},{x:'FY24',y:1800}]} color={color} areaFill title="Homelessness Spending Growth ($M)" yLabel="Millions ($)" source="Homelessness Expense Tracker" />
  if (q === 'b10') return <HBarChart data={[{label:'LAPD (monopoly)',value:8500},{label:'LAHSA (monopoly)',value:7200},{label:'Public Works',value:3800},{label:'Fire',value:2900},{label:'Transportation',value:2100},{label:'Housing',value:1400}]} color={color} title="Vendor Concentration (HHI Score) by Dept" source="Checkbook LA" formatValue={v=>`${v}`} />

  // ACCOUNTABILITY
  if (q === 'a1') return <VBarChart data={[{label:'1',value:31.2},{label:'2',value:16.8},{label:'3',value:13.1},{label:'4',value:9.2},{label:'5',value:8.4},{label:'6',value:6.1},{label:'7',value:5.9},{label:'8',value:5.0},{label:'9',value:4.3}]} color={color} title="First-Digit Distribution — Actual vs. Expected (Benford's Law)" source="Checkbook LA (42,846 transactions)" />
  if (q === 'a2') return <TableChart columns={[{key:'vendor',label:'Vendor'},{key:'amount',label:'Amount',align:'right'},{key:'days',label:'Days Apart',align:'right'},{key:'count',label:'Duplicates',align:'right'}]} rows={[{vendor:'ABC Construction',amount:'$24,500',days:'3',count:'4'},{vendor:'Metro Security Services',amount:'$18,200',days:'2',count:'3'},{vendor:'Pacific Janitorial',amount:'$12,800',days:'5',count:'3'},{vendor:'Valley Electric Inc.',amount:'$45,000',days:'1',count:'2'},{vendor:'Westside Consulting',amount:'$8,900',days:'6',count:'2'}]} title="Potential Duplicate Payments (Same Vendor + Amount Within 7 Days)" source="Checkbook LA" highlightColumn="count" />
  if (q === 'a3') return <VBarChart data={[{label:'<$1K',value:4200},{label:'$1-5K',value:8900},{label:'$5-10K',value:3200},{label:'$10-25K',value:2800},{label:'$25-50K',value:1900},{label:'$50-100K',value:1400},{label:'$100K+',value:980}]} color={color} title="Payment Size Distribution — Clusters Near Thresholds?" source="Checkbook LA" />
  if (q === 'a4') return <LineChart data={[{x:'Jul',y:280},{x:'Aug',y:310},{x:'Sep',y:295},{x:'Oct',y:340},{x:'Nov',y:420},{x:'Dec',y:380},{x:'Jan',y:310},{x:'Feb',y:290},{x:'Mar',y:320},{x:'Apr',y:350},{x:'May',y:580},{x:'Jun',y:890}]} color={color} title="Monthly Spending — Fiscal Year-End Spike" source="Checkbook LA" yLabel="Transactions" bands={[{x1:10,x2:11,label:'Year-end spike'}]} />
  if (q === 'a5') return <ScatterPlot data={[{x:1,y:2400000,size:8},{x:2,y:1800000,size:7},{x:1,y:1200000,size:6},{x:3,y:950000,size:5},{x:2,y:780000,size:5},{x:5,y:620000,size:4},{x:1,y:540000,size:4},{x:8,y:480000,size:3},{x:12,y:420000,size:3},{x:3,y:380000,size:3},{x:15,y:320000},{x:22,y:280000},{x:35,y:250000},{x:48,y:180000},{x:65,y:120000}]} color={color} title="Transaction Count vs. Total $ — Large One-Off Vendors" xLabel="Number of transactions" yLabel="Total received ($)" source="Checkbook LA" />
  if (q === 'a6') return <TableChart columns={[{key:'zip',label:'ZIP'},{key:'vendors',label:'Vendors',align:'right'},{key:'total',label:'Total $',align:'right'},{key:'names',label:'Vendor Names'}]} rows={[{zip:'90012',vendors:'8',total:'$4.2M',names:'ABC Corp, ABC Services, ABC Solutions...'},{zip:'90015',vendors:'6',total:'$2.8M',names:'Metro Group, Metro Holdings, Metro LLC...'},{zip:'90071',vendors:'5',total:'$3.1M',names:'Downtown LLC, DT Services, DT Holdings...'},{zip:'91601',vendors:'4',total:'$1.9M',names:'Valley Inc, Valley Corp, Valley Group...'}]} title="Vendor Address Clustering — Multiple Vendors at Same ZIP" source="Checkbook LA" />
  if (q === 'a7') return <ScatterPlot data={[{x:50000,y:420000,size:6},{x:120000,y:890000,size:7},{x:80000,y:1200000,size:8},{x:200000,y:350000,size:4},{x:45000,y:680000,size:6},{x:30000,y:520000,size:5},{x:180000,y:240000,size:4},{x:65000,y:1800000,size:9},{x:25000,y:950000,size:7},{x:400000,y:280000,size:4}]} color={color} title="City Grants vs. Nonprofit Revenue — Dots Above Line = City-Dependent" xLabel="Nonprofit annual revenue ($)" yLabel="City grants received ($)" thresholdY={500000} thresholdLabel="50% dependency line" source="Entities + IRS BMF" />
  if (q === 'a8') return <TableChart columns={[{key:'name',label:'Organization'},{key:'ein',label:'EIN'},{key:'status',label:'IRS Status'},{key:'last_payment',label:'Last City Payment'},{key:'amount',label:'Amount',align:'right'}]} rows={[{name:'Community Action Network',ein:'95-XXXXXXX',status:'Revoked 2021',last_payment:'2023-06-15',amount:'$124,000'},{name:'Urban Youth Alliance',ein:'20-XXXXXXX',status:'Revoked 2020',last_payment:'2022-11-30',amount:'$89,500'},{name:'Neighborhood Health Corp',ein:'27-XXXXXXX',status:'Auto-revoked',last_payment:'2023-03-22',amount:'$67,200'}]} title="Payments to Organizations with Revoked Tax-Exempt Status" source="Entities + IRS BMF + Checkbook LA" highlightColumn="status" />
  if (q === 'a9') return <TableChart columns={[{key:'entity',label:'Entity'},{key:'grants',label:'City Grants',align:'right'},{key:'donated',label:'Donated',align:'right'},{key:'lobbying',label:'Lobbying $',align:'right'}]} rows={[{entity:'AECOM',grants:'$12.4M',donated:'$86K',lobbying:'$420K'},{entity:'Parsons Corp',grants:'$8.9M',donated:'$52K',lobbying:'$280K'},{entity:'CBRE Group',grants:'$6.2M',donated:'$44K',lobbying:'$190K'},{entity:'Motorola Solutions',grants:'$5.8M',donated:'$38K',lobbying:'$165K'},{entity:'Universal Protection',grants:'$4.1M',donated:'$28K',lobbying:'$120K'}]} title="The Money Triangle — Entities That Lobby + Donate + Receive Contracts" source="Cross-reference: 3 databases" highlightColumn="entity" />
  if (q === 'a10') return <LineChart data={[{x:'FY14',y:42},{x:'FY15',y:58},{x:'FY16',y:72},{x:'FY17',y:85},{x:'FY18',y:98},{x:'FY19',y:112},{x:'FY20',y:95},{x:'FY21',y:88},{x:'FY22',y:105},{x:'FY23',y:118},{x:'FY24',y:106}]} color={color} title="MV Transportation — Annual Payments from City ($M)" yLabel="Millions ($)" source="Checkbook LA + Lobbying Projects" />

  // CAMPAIGN
  if (q === 'c1') return <LineChart data={[{x:'2010',y:4.2},{x:'2012',y:5.8},{x:'2014',y:6.1},{x:'2016',y:7.4},{x:'2018',y:8.9},{x:'2020',y:11.2},{x:'2022',y:14.8},{x:'2024',y:16.2}]} color={color} areaFill title="Campaign Donations by Election Cycle ($M)" yLabel="Millions ($)" source="Ethics Commission" />
  if (q === 'c2') return <HBarChart data={[{label:'IBEW Local 18',value:2800000},{label:'Unite HERE Local 11',value:1900000},{label:'SEIU Local 721',value:1700000},{label:'LA Police Prot. League',value:1500000},{label:'Plumbers Local 761',value:1200000},{label:'AFSCME District 36',value:980000},{label:'Carpenters Local 1506',value:850000},{label:'DWP Employees Assn',value:720000}]} color={color} source="Ethics Commission" />
  if (q === 'c3') return <HBarChart data={[{label:'Karen Bass (Mayor)',value:12400000},{label:'Rick Caruso',value:104000000},{label:'Nithya Raman',value:3200000},{label:'Kevin de Leon',value:2800000},{label:'Heather Hutt',value:1900000},{label:'Traci Park',value:1600000},{label:'Tim McOsker',value:1400000}]} color={color} source="Ethics Commission" />
  if (q === 'c4') return <Treemap data={[{label:'Media/Advertising',value:28000000},{label:'Campaign Consultants',value:16000000},{label:'Fundraising',value:9800000},{label:'Printing/Mail',value:8200000},{label:'Staff Salaries',value:5400000},{label:'Office/Overhead',value:2800000},{label:'Other',value:1200000}]} colors={['#A855F7','#9345E7','#8235D7','#7125C7','#6015B7','#4F05A7','#3E0097']} source="Ethics Commission" />
  if (q === 'c5') return <TableChart columns={[{key:'entity',label:'Entity'},{key:'donated',label:'Donated',align:'right'},{key:'received',label:'Contracts',align:'right'},{key:'ratio',label:'ROI',align:'right'}]} rows={[{entity:'AECOM',donated:'$86,400',received:'$12.4M',ratio:'143x'},{entity:'Parsons Corp',donated:'$52,200',received:'$8.9M',ratio:'170x'},{entity:'CBRE Group',donated:'$44,100',received:'$6.2M',ratio:'141x'},{entity:'Motorola Solutions',donated:'$38,500',received:'$5.8M',ratio:'151x'},{entity:'Tutor Perini',donated:'$32,000',received:'$4.5M',ratio:'141x'}]} title="Donor-Vendor Overlap — Who Donates AND Gets Contracts" source="Campaign Contributions + Entities" highlightColumn="ratio" />
  if (q === 'c6') return <TableChart columns={[{key:'org',label:'Organization'},{key:'donated',label:'Donated',align:'right'},{key:'lobbying',label:'Lobbying $',align:'right'},{key:'dept',label:'Dept Lobbied'}]} rows={[{org:'Anschutz Entertainment',donated:'$96K',lobbying:'$480K',dept:'Planning, Council'},{org:'AEG',donated:'$72K',lobbying:'$360K',dept:'Mayor, Planning'},{org:'AIDS Healthcare Found.',donated:'$54K',lobbying:'$210K',dept:'Housing, Council'},{org:'Kilroy Realty',donated:'$48K',lobbying:'$180K',dept:'Planning'},{org:'JMB Realty',donated:'$42K',lobbying:'$165K',dept:'Planning, DWP'}]} title="Donor-Lobbyist Overlap" source="Campaign Contributions + Lobbying" />
  if (q === 'c7') return <ScatterPlot data={[{x:12000,y:48000,size:5},{x:8000,y:32000,size:4},{x:15000,y:62000,size:6},{x:5000,y:28000,size:3},{x:22000,y:85000,size:7},{x:3000,y:18000,size:3},{x:18000,y:72000,size:6},{x:9000,y:41000,size:4},{x:6000,y:25000,size:3},{x:28000,y:95000,size:8}]} color={color} xLabel="Donations to council member ($)" yLabel="Discretionary funds received ($)" title="Do Donors Get Discretionary Funds?" source="Campaign + Discretionary" />
  if (q === 'c8') return <SankeyDiagram title="Lobbying-to-Spending Pipeline" leftLabel="Lobbying Firms" rightLabel="Departments" leftColor="#A855F7" rightColor="#7C3AED" source="Lobbying + Checkbook" leftNodes={[{id:'m1',label:'Cerrell Associates',value:18},{id:'m2',label:'Mercury Public',value:14},{id:'m3',label:'Englander Knabe',value:12},{id:'m4',label:'David Gershwin',value:9},{id:'m5',label:'Manatt Phelps',value:8}]} rightNodes={[{id:'d1',label:'City Council',value:22},{id:'d2',label:'Planning',value:14},{id:'d3',label:'Mayor',value:12},{id:'d4',label:'DWP',value:8},{id:'d5',label:'Transportation',value:5}]} links={[{source:'m1',target:'d1',value:8},{source:'m1',target:'d2',value:6},{source:'m1',target:'d3',value:4},{source:'m2',target:'d1',value:5},{source:'m2',target:'d3',value:5},{source:'m2',target:'d4',value:4},{source:'m3',target:'d2',value:6},{source:'m3',target:'d1',value:4},{source:'m3',target:'d5',value:2},{source:'m4',target:'d1',value:4},{source:'m4',target:'d4',value:3},{source:'m4',target:'d5',value:2},{source:'m5',target:'d3',value:3},{source:'m5',target:'d2',value:3},{source:'m5',target:'d1',value:2}]} />
  if (q === 'c9') return <HBarChart data={[{label:'City Council',value:48200},{label:'Planning Dept',value:32100},{label:'Mayor\'s Office',value:28400},{label:'DWP',value:19200},{label:'Transportation',value:15800},{label:'Housing Dept',value:12400},{label:'Public Works',value:9800},{label:'Building & Safety',value:7200}]} color={color} source="Lobbying Projects" formatValue={v=>`${(v/1000).toFixed(1)}K`} />
  if (q === 'c10') return <HBarChart data={[{label:'Cerrell Associates',value:4200000},{label:'Mercury Public Affairs',value:3800000},{label:'Englander Knabe',value:3100000},{label:'David Gershwin',value:2400000},{label:'Manatt Phelps',value:2100000},{label:'Platinum Advisors',value:1800000},{label:'Nelson Mullins',value:1500000}]} color={color} source="Lobbying Payments" />

  // POLICING
  if (q === 'p1') return <VBarChart data={[{label:'FY20',value:1860},{label:'FY21',value:1710},{label:'FY22',value:1930},{label:'FY23',value:2030},{label:'FY24',value:2140}]} color={color} source="City Budget + Checkbook" title="LAPD Total Spending ($M) — Adopted + Overtime + Settlements" />
  if (q === 'p2') return <LineChart data={[{x:'Jul',y:12},{x:'Aug',y:14},{x:'Sep',y:11},{x:'Oct',y:18},{x:'Nov',y:22},{x:'Dec',y:28},{x:'Jan',y:15},{x:'Feb',y:13},{x:'Mar',y:16},{x:'Apr',y:19},{x:'May',y:35},{x:'Jun',y:48}]} color={color} title="LAPD Overtime Spending by Month ($M)" yLabel="Millions ($)" bands={[{x1:10,x2:11,label:'Year-end'}]} source="Checkbook LA" />
  if (q === 'p3') return <VBarChart data={[{label:'2018',value:48},{label:'2019',value:62},{label:'2020',value:85},{label:'2021',value:72},{label:'2022',value:58},{label:'2023',value:45},{label:'2024',value:38}]} color={color} source="Council Files" title="LAPD Settlement Payouts by Year ($M)" />
  if (q === 'p4') return <HBarChart data={[{label:'Hispanic/Latino',value:42},{label:'Black',value:28},{label:'White',value:18},{label:'Asian',value:8},{label:'Other',value:4}]} color={color} title="RIPA Stops by Race (%) vs. Population Share" source="RIPA Stops" formatValue={v=>`${v}%`} />
  if (q === 'p5') return <LineChart data={[{x:'2020',y:82000},{x:'2021',y:78000},{x:'2022',y:74000},{x:'2023',y:71000},{x:'2024',y:68000}]} color={color} title="LAPD Arrests by Year" source="Arrests" />
  if (q === 'p6') return <LineChart data={[{x:'Jan',y:95000},{x:'Feb',y:88000},{x:'Mar',y:92000},{x:'Apr',y:98000},{x:'May',y:102000},{x:'Jun',y:108000},{x:'Jul',y:115000},{x:'Aug',y:112000},{x:'Sep',y:105000},{x:'Oct',y:99000},{x:'Nov',y:94000},{x:'Dec',y:91000}]} color={color} areaFill title="LAPD Calls for Service by Month" source="LAPD Calls" />
  if (q === 'p7') return <VBarChart data={[{label:'2012',value:14},{label:'2013',value:16},{label:'2014',value:18},{label:'2015',value:15},{label:'2016',value:20},{label:'2017',value:22},{label:'2018',value:19},{label:'2019',value:17},{label:'2020',value:21},{label:'2021',value:24},{label:'2022',value:18}]} color={color} source="CA DOJ" title="Custodial Deaths by Year" />
  if (q === 'p8') return <HBarChart data={[{label:'LA County Sheriff',value:82},{label:'LAPD',value:45},{label:'CDCR (State)',value:38},{label:'CHP',value:12},{label:'Long Beach PD',value:8},{label:'Other',value:15}]} color={color} source="CA DOJ" formatValue={v=>`${v}`} />
  if (q === 'p9') return <VBarChart data={[{label:'White',value:22},{label:'Black',value:35},{label:'Hispanic',value:28},{label:'Asian',value:8},{label:'Other',value:7}]} color={color} title="Custodial Deaths by Race (%) vs. Population Share" source="CA DOJ" />
  if (q === 'p10') return <DonutChart data={[{label:'LAPD',value:3400},{label:'LAFD',value:980},{label:'Public Works',value:1100},{label:'All Other',value:7720}]} centerValue="26%" centerLabel="LAPD share" source="City Budget" />

  // SAFETY
  if (q === 's1') return <LineChart data={[{x:'2020',y:98000},{x:'2021',y:112000},{x:'2022',y:128000},{x:'2023',y:135000},{x:'2024',y:142000},{x:'2025',y:148000}]} color={color} title="Traffic Collisions per Year" yLabel="Collisions" bands={[{x1:0,x2:1,label:'COVID'}]} source="LAPD" />
  if (q === 's2') return <LineChart data={[{x:'2019',y:244},{x:'2020',y:294},{x:'2021',y:312},{x:'2022',y:337},{x:'2023',y:362},{x:'2024',y:388}]} color={color} title="Traffic Fatalities — Vision Zero Failed" yLabel="Deaths" source="LAPD" />
  if (q === 's3') return <HBarChart data={[{label:'77th Street',value:38200},{label:'Southwest',value:35800},{label:'Southeast',value:32400},{label:'Newton',value:31200},{label:'Central',value:28900},{label:'Hollywood',value:26400},{label:'Rampart',value:24800},{label:'Van Nuys',value:22100}]} color={color} source="LAPD" formatValue={v=>`${(v/1000).toFixed(1)}K`} />
  if (q === 's4') return <VBarChart data={[{label:'18-24',value:82},{label:'25-34',value:148},{label:'35-44',value:126},{label:'45-54',value:98},{label:'55-64',value:72},{label:'65+',value:45}]} color={color} title="Collision Victims by Age Group (thousands)" source="LAPD" />
  if (q === 's5') return <HBarChart data={[{label:'Central',value:42},{label:'Hollywood',value:38},{label:'Rampart',value:35},{label:'Newton',value:32},{label:'77th Street',value:28},{label:'Southeast',value:25},{label:'Southwest',value:22}]} color={color} title="Pedestrian Fatalities by Area" source="LAPD" formatValue={v=>`${v}`} />
  if (q === 's6') return <ScatterPlot data={[{x:1,y:2.1,size:3},{x:3,y:2.4,size:3},{x:5,y:3.1,size:4},{x:7,y:2.0,size:3},{x:8,y:2.8,size:3},{x:10,y:4.2,size:6},{x:12,y:2.3,size:3},{x:14,y:2.6,size:3},{x:15,y:3.5,size:4},{x:17,y:2.1,size:3},{x:19,y:2.9,size:3},{x:22,y:3.8,size:5},{x:24,y:2.5,size:3}]} color={color} title="Earthquakes M2.0+ Near LA Since 2024" xLabel="Months since Jan 2024" yLabel="Magnitude" source="USGS" />
  if (q === 's7') return <Gauge value={67} color={color} label="buildings compliant before April 2026 deadline" title="Soft-Story Retrofit Compliance" source="Soft-Story Permits" />
  if (q === 's8') return <VBarChart data={[{label:'<3m',value:12},{label:'3-4m',value:28},{label:'4-5m',value:35},{label:'5-6m',value:18},{label:'6-7m',value:8},{label:'7-8m',value:4},{label:'8m+',value:2}]} color={color} title="LAFD Response Time Distribution (minutes)" source="LAFD Response" />

  // HOUSING
  if (q === 'h1') return <VBarChart data={[{label:'2019',value:3200},{label:'2020',value:3800},{label:'2021',value:4100},{label:'2022',value:4600},{label:'2023',value:5200},{label:'2024',value:4800}]} color={color} source="Building Permits" title="New Residential Permits by Year" />
  if (q === 'h2') return <DonutChart data={[{label:'Multi-Family',value:3200},{label:'Single Family',value:820},{label:'ADU',value:580},{label:'Mixed Use',value:200}]} centerValue="4.8K" centerLabel="permits" source="Building Permits" />
  if (q === 'h3') return <LineChart data={[{x:'Q1\'23',y:42},{x:'Q2\'23',y:58},{x:'Q3\'23',y:48},{x:'Q4\'23',y:62},{x:'Q1\'24',y:38},{x:'Q2\'24',y:52},{x:'Q3\'24',y:45},{x:'Q4\'24',y:68}]} color={color} areaFill title="ULA Mansion Tax Revenue by Quarter ($M)" source="ULA Revenue" yLabel="Millions ($)" />
  if (q === 'h4') return <HBarChart data={[{label:'CD5 (Westside)',value:82},{label:'CD11 (Brentwood)',value:68},{label:'CD4 (Silver Lake)',value:52},{label:'CD2 (Studio City)',value:45},{label:'CD13 (Hollywood)',value:38}]} color={color} title="ULA Revenue by Council District ($M)" source="ULA Revenue" formatValue={v=>`$${v}M`} />
  if (q === 'h5') return <Gauge value={67} color={color} label="13,277 buildings — April 2026 deadline" title="Soft-Story Retrofit Compliance" source="Soft-Story Permits" />
  if (q === 'h6') return <HBarChart data={[{label:'Hollywood',value:1820},{label:'Koreatown',value:1540},{label:'Mid-Wilshire',value:1280},{label:'Westlake',value:1120},{label:'East Hollywood',value:980},{label:'Silver Lake',value:840},{label:'Venice',value:720},{label:'Other',value:4977}]} color={color} title="Unreinforced Buildings by Neighborhood" source="Soft-Story Permits" formatValue={v=>`${v}`} />
  if (q === 'h7') return <Treemap data={[{label:'LAHSA',value:1420},{label:'PATH',value:82},{label:'LA Family Housing',value:65},{label:'The People Concern',value:48},{label:'St. Joseph Center',value:32},{label:'Brilliant Corners',value:28},{label:'All Other',value:125}]} colors={['#00B894','#00A884','#009874','#008864','#007854','#006844','#005834']} source="Homelessness Spending" title="Homelessness Spending by Vendor ($M)" />
  if (q === 'h8') return <TableChart columns={[{key:'org',label:'Organization'},{key:'grants',label:'City Grants',align:'right'},{key:'revenue',label:'Annual Revenue',align:'right'},{key:'ratio',label:'Grant/Rev %',align:'right'},{key:'officer_comp',label:'Officer Comp',align:'right'}]} rows={[{org:'Community Solutions Inc',grants:'$2.4M',revenue:'$320K',ratio:'750%',officer_comp:'$185K'},{org:'Urban Bridge Foundation',grants:'$1.8M',revenue:'$210K',ratio:'857%',officer_comp:'$165K'},{org:'LA Hope Center',grants:'$1.2M',revenue:'$180K',ratio:'667%',officer_comp:'$142K'},{org:'Neighborhood Connect',grants:'$980K',revenue:'$150K',ratio:'653%',officer_comp:'$128K'}]} title="Red Flags: Organizations Where City Grants >> Revenue" source="Entities + IRS BMF (990 Data)" highlightColumn="ratio" />
  if (q === 'h9') return <ScatterPlot data={[{x:82,y:1420,size:10},{x:74,y:82,size:6},{x:68,y:65,size:5},{x:71,y:48,size:4},{x:78,y:32,size:4},{x:65,y:28,size:3},{x:58,y:18,size:3},{x:45,y:12,size:2}]} color={color} title="Program Expense Ratio vs. Total Grants Received" xLabel="Program expense ratio (%)" yLabel="Total grants ($M)" source="IRS 990 Data" thresholdY={50} thresholdLabel="$50M" />
  if (q === 'h10') return <VBarChart data={[{label:'Central',value:48000},{label:'Hollywood',value:42000},{label:'Wilshire',value:38000},{label:'Valley',value:32000},{label:'West LA',value:28000},{label:'South LA',value:22000}]} color={color} title="Rent-Stabilized Units by Area" source="Rent Stabilization" />
  if (q === 'h11') return <LineChart data={[{x:'2019',y:4200},{x:'2020',y:1800},{x:'2021',y:2100},{x:'2022',y:3800},{x:'2023',y:5200},{x:'2024',y:6100}]} color={color} title="Eviction Notices Filed by Year" bands={[{x1:1,x2:2,label:'COVID moratorium'}]} source="Eviction Notices" />
  if (q === 'h12') return <HBarChart data={[{label:'South LA',value:2800},{label:'Downtown',value:2200},{label:'East LA',value:1800},{label:'Hollywood',value:1500},{label:'Valley',value:1200},{label:'Westside',value:800}]} color={color} title="Affordable Housing Units by Area" source="Affordable Housing" formatValue={v=>`${v}`} />

  // PEOPLE
  if (q === 'pe1') return <HBarChart data={[{label:'Hispanic/Latino',value:4800000},{label:'White (non-Hispanic)',value:2600000},{label:'Asian',value:1500000},{label:'Black',value:800000},{label:'Two or more',value:200000},{label:'Other',value:100000}]} color={color} source="Census ACS" formatValue={v=>`${(v/1e6).toFixed(1)}M`} />
  if (q === 'pe2') return <VBarChart data={[{label:'<25K',value:420},{label:'25-50K',value:580},{label:'50-75K',value:490},{label:'75-100K',value:380},{label:'100-150K',value:320},{label:'150K+',value:308}]} color={color} title="Income Distribution by Census Tract (count of tracts)" source="Census ACS" />
  if (q === 'pe3') return <HBarChart data={[{label:'Tract 2245 (Skid Row)',value:68},{label:'Tract 2232 (Watts)',value:52},{label:'Tract 2071 (Westlake)',value:48},{label:'Tract 2402 (Florence)',value:45},{label:'Tract 2341 (South Central)',value:42}]} color={color} title="Highest-Poverty Census Tracts (%)" source="Census ACS" formatValue={v=>`${v}%`} />
  if (q === 'pe4') return <HBarChart data={[{label:'Westlake',value:38},{label:'Koreatown',value:32},{label:'Pico-Union',value:28},{label:'Downtown',value:25},{label:'East Hollywood',value:22},{label:'MacArthur Park',value:20}]} color={color} title="Communities Without Vehicle Access (% of households)" source="Census ACS" formatValue={v=>`${v}%`} />
  if (q === 'pe5') return <VBarChart data={[{label:'White',value:82000},{label:'Asian',value:68000},{label:'Hispanic',value:48000},{label:'Black',value:42000},{label:'Mixed',value:55000}]} color={color} title="Median Household Income by Racial Majority of Tract" source="Census ACS" />
  if (q === 'pe6') return <HeatGrid data={Array.from({length:48},(_,i)=>({value:Math.sin(i*0.3)*0.4+0.5+Math.random()*0.2}))} color={color} title="Linguistic Isolation by Census Tract" source="Census ACS" />

  // HEALTH
  if (q === 'he1') return <LineChart data={[{x:'D1',y:8.2},{x:'D2',y:9.1},{x:'D3',y:9.8},{x:'D4',y:10.6},{x:'D5',y:11.2},{x:'D6',y:12.1},{x:'D7',y:12.8},{x:'D8',y:13.9},{x:'D9',y:14.5},{x:'D10',y:16.1}]} color={color} title="Asthma Rate by Pollution Decile — Monotonic Relationship" yLabel="Asthma prevalence (%)" source="CDC PLACES + CalEnviroScreen" />
  if (q === 'he2') return <HBarChart data={[{label:'Tract 2921 (Wilmington)',value:98},{label:'Tract 2912 (San Pedro)',value:95},{label:'Tract 2071 (Westlake)',value:92},{label:'Tract 2245 (Skid Row)',value:89},{label:'Tract 2341 (Vernon)',value:86}]} color={color} title="Worst Environmental Burden Tracts (CES Score)" source="CalEnviroScreen" formatValue={v=>`${v}`} />
  if (q === 'he3') return <HeatGrid data={Array.from({length:48},(_,i)=>({value:8+Math.sin(i*0.4)*4+Math.random()*3}))} cols={8} color={color} title="Asthma Prevalence by Census Tract (%)" source="CDC PLACES" />
  if (q === 'he4') return <ScatterPlot data={Array.from({length:30},(_,i)=>({x:10+Math.random()*40,y:8+i*0.3+Math.random()*4,size:3+Math.random()*3}))} color={color} title="Diabetes Rate vs. Poverty Rate by Tract" xLabel="Poverty rate (%)" yLabel="Diabetes prevalence (%)" source="CDC PLACES + Census ACS" />
  if (q === 'he5') return <VBarChart data={[{label:'D1',value:4.2},{label:'D2',value:5.1},{label:'D3',value:6.8},{label:'D4',value:7.9},{label:'D5',value:9.2},{label:'D6',value:10.8},{label:'D7',value:12.4},{label:'D8',value:14.1},{label:'D9',value:16.8},{label:'D10',value:22.5}]} color={color} title="PM2.5 Exposure by Pollution Decile (ug/m3)" source="CalEnviroScreen" />
  if (q === 'he6') return <ScatterPlot data={Array.from({length:25},(_,i)=>({x:20+i*3+Math.random()*10,y:200+Math.random()*500-i*15,size:4}))} color={color} title="City Investment vs. Environmental Burden" xLabel="CalEnviroScreen score" yLabel="Per-tract city spending ($K)" source="CalEnviroScreen + Checkbook LA" />
  if (q === 'he7') return <LineChart data={[{x:'2020',y:12},{x:'2021',y:28},{x:'2022',y:45},{x:'2023',y:82},{x:'2024',y:65},{x:'2025',y:48}]} color={color} title='Council Mentions of "Fentanyl" vs. Spending ($M)' yLabel="Count / $M" source="Transcripts + Checkbook LA" />
  if (q === 'he8') return <DonutChart data={[{label:'MWD Imported',value:52},{label:'LA Aqueduct',value:18},{label:'Groundwater',value:16},{label:'Recycled',value:14}]} centerValue="100%" centerLabel="supply" source="DWP Water Supply" title="LA Water Supply Sources" />
  if (q === 'he9') return <LineChart data={[{x:'Jan',y:42},{x:'Feb',y:38},{x:'Mar',y:28},{x:'Apr',y:22},{x:'May',y:18},{x:'Jun',y:32},{x:'Jul',y:45},{x:'Aug',y:52},{x:'Sep',y:48},{x:'Oct',y:35},{x:'Nov',y:28},{x:'Dec',y:38}]} color={color} title="DWP Power Outages by Month" source="DWP Outages" />

  // INFRASTRUCTURE
  if (q === 'i1') return <DonutChart data={[{label:'Single Space',value:18000},{label:'Double Space',value:9000},{label:'Multi-Space',value:7245}]} centerValue="34K" centerLabel="meters" source="Parking Meters" colors={['#FDCB6E','#E6B84E','#CCA53E']} />
  if (q === 'i2') return <VBarChart data={[{label:'FY20',value:148},{label:'FY21',value:122},{label:'FY22',value:168},{label:'FY23',value:185},{label:'FY24',value:208}]} color={color} title="Parking Revenue by Year ($M)" source="Parking Meters + Citations" />
  if (q === 'i3') return <HBarChart data={[{label:'Bulky Item Pickup',value:185000},{label:'Graffiti Removal',value:142000},{label:'Pothole Repair',value:128000},{label:'Illegal Dumping',value:115000},{label:'Homeless Encampment',value:98000},{label:'Street Light Repair',value:82000},{label:'Tree Maintenance',value:68000},{label:'Dead Animal',value:45000}]} color={color} title="Top 311 Request Types" source="MyLA311" formatValue={v=>`${(v/1000).toFixed(0)}K`} />
  if (q === 'i4') return <HeatGrid data={Array.from({length:48},(_,i)=>({value:500+Math.random()*2000}))} cols={8} color={color} title="311 Requests by Neighborhood (per 1,000 residents)" source="MyLA311" />
  if (q === 'i5') return <VBarChart data={[{label:'<1d',value:22},{label:'1-3d',value:35},{label:'3-7d',value:25},{label:'1-2w',value:12},{label:'2-4w',value:4},{label:'4w+',value:2}]} color={color} title="311 Response Time Distribution (%)" source="MyLA311" />
  if (q === 'i6') return <StatCard stats={[{value:'35',label:'HPOZs',sublabel:'Historic Preservation Overlay Zones'},{value:'28K',label:'Properties',sublabel:'within HPOZ boundaries'},{value:'1983',label:'First HPOZ',sublabel:'Angelino Heights'}]} color={color} source="HPOZ Boundaries" />
  if (q === 'i7') return <StatCard stats={[{value:'30',label:'Cultural Venues',sublabel:'DCA-managed facilities'},{value:'$42M',label:'Annual Budget',sublabel:'Dept of Cultural Affairs'},{value:'2.1M',label:'Annual Visitors',sublabel:'across all venues'}]} color={color} source="Cultural Facilities" />
  if (q === 'i8') return <StatCard stats={[{value:'42',label:'BIDs',sublabel:'Business Improvement Districts'},{value:'$65M',label:'Annual Assessments',sublabel:'collected from property owners'},{value:'7,500+',label:'Businesses',sublabel:'within BID boundaries'}]} color={color} source="BID Boundaries" />
  if (q === 'i9') return <LineChart data={[{x:'2018',y:3.8},{x:'2019',y:4.1},{x:'2020',y:2.8},{x:'2021',y:3.2},{x:'2022',y:3.9},{x:'2023',y:4.2},{x:'2024',y:4.5}]} color={color} title="Parking Citations Issued per Year (millions)" yLabel="Millions" source="Parking Citations" />
  if (q === 'i10') return <LineChart data={[{x:'2018',y:520},{x:'2019',y:542},{x:'2020',y:485},{x:'2021',y:498},{x:'2022',y:535},{x:'2023',y:568},{x:'2024',y:592}]} color={color} areaFill title="Active Business Licenses (thousands)" source="Active Businesses" />

  // GOVERNANCE
  if (q === 'g1') return <Timeline events={[{date:'Jan 2025',label:'CF 25-1026: Rent Stabilization Ordinance update',category:'Housing',color:'#00B894'},{date:'Feb 2025',label:'CF 25-0089: LAPD overtime cap proposal',category:'Policing',color:'#1E3A5F'},{date:'Mar 2025',label:'CF 25-0142: Measure ULA implementation',category:'Housing',color:'#00B894'},{date:'Apr 2025',label:'CF 25-0201: Cannabis licensing reform',category:'Business',color:'#FDCB6E'},{date:'Jun 2025',label:'CF 25-0312: Homelessness accountability act',category:'Housing',color:'#00B894'},{date:'Aug 2025',label:'CF 25-0445: LAPD settlement transparency',category:'Policing',color:'#1E3A5F'},{date:'Oct 2025',label:'CF 25-0518: DWP rate increase hearing',category:'Infrastructure',color:'#FDCB6E'},{date:'Dec 2025',label:'CF 25-0632: Budget amendment for fire season',category:'Safety',color:'#E84855'}]} title="Council Files by Month — 2025-2026" source="CFMS Scraper" defaultColor={color} />
  if (q === 'g2') return <VBarChart data={[{label:'2019',value:520},{label:'2020',value:480},{label:'2021',value:510},{label:'2022',value:545},{label:'2023',value:580},{label:'2024',value:610},{label:'2025',value:320}]} color={color} title="Council Meetings per Year" source="PrimeGov Metadata" />
  if (q === 'g3') return <HBarChart data={[{label:'Housing & Homelessness',value:4200000},{label:'Budget & Finance',value:3800000},{label:'Policing & Public Safety',value:3200000},{label:'Transportation',value:2800000},{label:'Planning & Land Use',value:2400000},{label:'Environment',value:1800000},{label:'Cannabis',value:1200000},{label:'Settlements',value:980000}]} color={color} title="Most-Discussed Topics in Council (word count)" source="Transcript Analysis" formatValue={v=>`${(v/1e6).toFixed(1)}M`} />
  if (q === 'g4') return <ScatterPlot data={[{x:0,y:12400000,size:8},{x:45,y:8200000,size:7},{x:120,y:5100000,size:6},{x:0,y:4800000,size:5},{x:280,y:3200000,size:5},{x:15,y:2800000,size:4},{x:0,y:2400000,size:4},{x:520,y:1800000,size:3}]} color={color} title="Settlement $ vs. Council Discussion Time (words)" xLabel="Words of discussion" yLabel="Settlement amount ($)" source="Council Files + Transcripts" />
  if (q === 'g5') return <DonutChart data={[{label:'Human Services',value:28},{label:'Education',value:22},{label:'Health',value:18},{label:'Arts & Culture',value:12},{label:'Religion',value:10},{label:'Environment',value:5},{label:'Other',value:5}]} source="IRS BMF" title="CA Nonprofits by NTEE Category" />
  if (q === 'g6') return <HBarChart data={[{label:'Kaiser Foundation',value:42000000000},{label:'Stanford Health',value:18000000000},{label:'Cedars-Sinai',value:5400000000},{label:'UCLA Foundation',value:4200000000},{label:'Children\'s Hospital LA',value:3100000000},{label:'LAHSA',value:1420000000}]} color={color} source="IRS BMF" formatValue={v=>v>=1e9?`$${(v/1e9).toFixed(0)}B`:`$${(v/1e6).toFixed(0)}M`} />
  if (q === 'g7') return <DonutChart data={[{label:'For-profit (47.9%)',value:991},{label:'Nonprofit (21.8%)',value:1126},{label:'Government (30.0%)',value:76},{label:'Individual (0.3%)',value:521}]} centerValue="2,714" centerLabel="entities" source="Entity Resolution" />
  if (q === 'g8') return <FunnelChart steps={[{label:'Raw vendor names',value:2714,sublabel:'from Checkbook LA'},{label:'IRS BMF fuzzy match',value:746,sublabel:'matched to nonprofit database'},{label:'ProPublica API',value:219,sublabel:'990 financials retrieved'},{label:'Manual classification',value:218,sublabel:'hand-reviewed edge cases'},{label:'Pattern classification',value:1531,sublabel:'automated rules (LLC=for-profit, etc.)'}]} color={color} title="Entity Resolution Pipeline" source="Entity Resolution" />
  if (q === 'g9') return <HBarChart data={[{label:'HUD',value:820000000},{label:'DOT',value:420000000},{label:'HHS',value:280000000},{label:'DOJ',value:180000000},{label:'EPA',value:120000000},{label:'FEMA',value:95000000}]} color={color} source="USASpending.gov" title="Federal Grants to LA by Agency" />
  if (q === 'g10') return <HBarChart data={[{label:'LAPD',value:1800000000},{label:'LAFD',value:680000000},{label:'DWP',value:520000000},{label:'Public Works',value:380000000},{label:'Transportation',value:280000000},{label:'Rec & Parks',value:190000000}]} color={color} source="City Payroll" title="Payroll by Department (includes overtime)" />

  // Catch-all fallback — should never reach here now
  return <VBarChart data={[{label:'A',value:100},{label:'B',value:80},{label:'C',value:60}]} color={color} source={src} />
}
