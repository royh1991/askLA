'use client'

import { motion } from 'framer-motion'
import { SankeyDiagram, LineChart, HBarChart, DonutChart, Treemap, Gauge, HeatGrid, ScatterPlot } from '../charts'

interface SignatureVizProps {
  sectionId: string
  color: string
}

export function SignatureViz({ sectionId, color }: SignatureVizProps) {
  const viz = SIGNATURE_VIZS[sectionId]
  if (!viz) return null

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 64px' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        style={{ border: '3px solid #1A1A1A' }}
      >
        {viz}
      </motion.div>
    </div>
  )
}

// ─── Signature visualizations by section ────────────
const SIGNATURE_VIZS: Record<string, React.ReactNode> = {
  budget: (
    <SankeyDiagram
      title="LA City Budget Flow — Revenue Sources to Department Spending"
      leftLabel="Revenue" rightLabel="Spending" centerLabel="FY 2024-25"
      leftColor="#0984E3" rightColor="#6C5CE7"
      source="LA Controller / City Budget (uyzw-yi8n)"
      leftNodes={[
        { id: 'property', label: 'Property Tax', value: 2800000000 },
        { id: 'sales', label: 'Sales Tax', value: 1100000000 },
        { id: 'utility', label: 'Utility Users Tax', value: 680000000 },
        { id: 'business', label: 'Business Tax', value: 890000000 },
        { id: 'documentary', label: 'Documentary Transfer', value: 420000000 },
        { id: 'licenses', label: 'Licenses & Permits', value: 310000000 },
        { id: 'fines', label: 'Fines & Penalties', value: 280000000 },
        { id: 'federal', label: 'Federal & State Grants', value: 1200000000 },
        { id: 'other_rev', label: 'Other Revenue', value: 2520000000 },
      ]}
      rightNodes={[
        { id: 'police', label: 'Police (LAPD)', value: 3400000000 },
        { id: 'fire', label: 'Fire (LAFD)', value: 980000000 },
        { id: 'public_works', label: 'Public Works', value: 1100000000 },
        { id: 'transportation', label: 'Transportation', value: 520000000 },
        { id: 'housing', label: 'Housing & Community', value: 450000000 },
        { id: 'rec_parks', label: 'Rec & Parks', value: 380000000 },
        { id: 'dwp', label: 'DWP Transfer', value: 280000000 },
        { id: 'homelessness', label: 'Homelessness', value: 1800000000 },
        { id: 'debt', label: 'Debt Service', value: 680000000 },
        { id: 'other_dept', label: 'All Other Depts', value: 2610000000 },
      ]}
      links={[
        { source: 'property', target: 'police', value: 1200000000 },
        { source: 'property', target: 'fire', value: 600000000 },
        { source: 'property', target: 'public_works', value: 500000000 },
        { source: 'property', target: 'debt', value: 500000000 },
        { source: 'sales', target: 'police', value: 400000000 },
        { source: 'sales', target: 'transportation', value: 300000000 },
        { source: 'sales', target: 'rec_parks', value: 200000000 },
        { source: 'sales', target: 'other_dept', value: 200000000 },
        { source: 'utility', target: 'police', value: 300000000 },
        { source: 'utility', target: 'fire', value: 200000000 },
        { source: 'utility', target: 'other_dept', value: 180000000 },
        { source: 'business', target: 'police', value: 350000000 },
        { source: 'business', target: 'public_works', value: 300000000 },
        { source: 'business', target: 'other_dept', value: 240000000 },
        { source: 'federal', target: 'homelessness', value: 800000000 },
        { source: 'federal', target: 'housing', value: 400000000 },
        { source: 'other_rev', target: 'homelessness', value: 1000000000 },
        { source: 'other_rev', target: 'police', value: 600000000 },
        { source: 'other_rev', target: 'other_dept', value: 920000000 },
        { source: 'documentary', target: 'housing', value: 320000000 },
        { source: 'documentary', target: 'other_dept', value: 100000000 },
        { source: 'licenses', target: 'public_works', value: 200000000 },
        { source: 'licenses', target: 'other_dept', value: 110000000 },
        { source: 'fines', target: 'police', value: 150000000 },
        { source: 'fines', target: 'transportation', value: 130000000 },
        { source: 'dwp', target: 'dwp', value: 280000000 },
      ]}
    />
  ),

  accountability: (
    <div style={{ padding: 24, background: '#F5F5F0' }}>
      <div style={{ fontFamily: 'var(--font-body), sans-serif', fontSize: 15, fontWeight: 600, color: '#1A1A1A', marginBottom: 16 }}>
        Benford&apos;s Law Analysis — First-Digit Distribution of City Payments
      </div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <HBarChart
            data={[
              { label: '1 (expected 30.1%)', value: 31.2 },
              { label: '2 (expected 17.6%)', value: 16.8 },
              { label: '3 (expected 12.5%)', value: 13.1 },
              { label: '4 (expected 9.7%)', value: 9.2 },
              { label: '5 (expected 7.9%)', value: 8.4 },
              { label: '6 (expected 6.7%)', value: 6.1 },
              { label: '7 (expected 5.8%)', value: 5.9 },
              { label: '8 (expected 5.1%)', value: 5.0 },
              { label: '9 (expected 4.6%)', value: 4.3 },
            ]}
            color="#D63031"
            formatValue={(v) => `${v.toFixed(1)}%`}
            source="Checkbook LA (42,846 transactions)"
          />
        </div>
      </div>
    </div>
  ),

  campaign: (
    <DonutChart
      title="Campaign Contributions by Seat Type"
      data={[
        { label: 'City Council', value: 42000000 },
        { label: 'Mayor', value: 28000000 },
        { label: 'City Attorney', value: 8200000 },
        { label: 'Controller', value: 6000000 },
        { label: 'Other', value: 4000000 },
      ]}
      colors={['#A855F7', '#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95']}
      centerValue="$88M" centerLabel="total"
      source="Ethics Commission (m6g2-gc6c)"
    />
  ),

  policing: (
    <LineChart
      title="LAPD Budget — Adopted vs. Actual Spending (FY 2019-2024)"
      data={[
        { x: 'FY19', y: 1730000000 }, { x: 'FY20', y: 1860000000 },
        { x: 'FY21', y: 1710000000 }, { x: 'FY22', y: 1930000000 },
        { x: 'FY23', y: 2030000000 }, { x: 'FY24', y: 2140000000 },
      ]}
      color="#1E3A5F"
      yLabel="Dollars"
      bands={[{ x1: 1, x2: 2, label: 'COVID' }]}
      source="City Budget + Checkbook LA"
    />
  ),

  safety: (
    <LineChart
      title="Traffic Collisions, Injuries, and Fatalities — LA 2020-2025"
      data={[
        { x: '2020', y: 98000 }, { x: '2021', y: 112000 },
        { x: '2022', y: 128000 }, { x: '2023', y: 135000 },
        { x: '2024', y: 142000 }, { x: '2025', y: 148000 },
      ]}
      color="#E84855"
      yLabel="Collisions"
      source="LAPD (d5tf-ez2w)"
    />
  ),

  housing: (
    <Treemap
      title="Homelessness Spending by Vendor — Who Gets $1.8B?"
      data={[
        { label: 'LAHSA', value: 1420000000 },
        { label: 'PATH', value: 82000000 },
        { label: 'LA Family Housing', value: 65000000 },
        { label: 'The People Concern', value: 48000000 },
        { label: 'St. Joseph Center', value: 32000000 },
        { label: 'Brilliant Corners', value: 28000000 },
        { label: 'All Other Vendors', value: 125000000 },
      ]}
      colors={['#00B894', '#00A884', '#009874', '#008864', '#007854', '#006844', '#005834']}
      source="Homelessness Expense Tracker (98ve-cuf5)"
    />
  ),

  people: (
    <HBarChart
      title="LA County Population by Race/Ethnicity"
      data={[
        { label: 'Hispanic/Latino', value: 4800000 },
        { label: 'White (non-Hispanic)', value: 2600000 },
        { label: 'Asian', value: 1500000 },
        { label: 'Black', value: 800000 },
        { label: 'Two or more races', value: 200000 },
        { label: 'Other', value: 100000 },
      ]}
      color="#0984E3"
      formatValue={(v) => `${(v / 1e6).toFixed(1)}M`}
      source="Census ACS 5-Year Estimates"
    />
  ),

  health: (
    <LineChart
      title="Health Burden by Pollution Decile — Higher Pollution = Worse Health"
      data={[
        { x: 'D1 (cleanest)', y: 8.2 }, { x: 'D2', y: 9.1 },
        { x: 'D3', y: 9.8 }, { x: 'D4', y: 10.6 },
        { x: 'D5', y: 11.2 }, { x: 'D6', y: 12.1 },
        { x: 'D7', y: 12.8 }, { x: 'D8', y: 13.9 },
        { x: 'D9', y: 14.5 }, { x: 'D10 (most polluted)', y: 16.1 },
      ]}
      color="#00CEC9"
      yLabel="Avg Asthma Rate (%)"
      source="CDC PLACES + CalEnviroScreen"
    />
  ),

  infrastructure: (
    <DonutChart
      title="Parking Meter Inventory by Type"
      data={[
        { label: 'Single Space', value: 18000 },
        { label: 'Double Space', value: 9000 },
        { label: 'Multi-Space', value: 7245 },
      ]}
      colors={['#FDCB6E', '#E6B84E', '#CCA53E']}
      centerValue="34K" centerLabel="meters"
      source="Parking Meters (s49e-q6j2)"
    />
  ),

  governance: (
    <DonutChart
      title="Entity Types Receiving City Grants"
      data={[
        { label: 'For-profit', value: 991, color: '#636E72' },
        { label: 'Nonprofit', value: 1126, color: '#00B894' },
        { label: 'Government', value: 76, color: '#0984E3' },
        { label: 'Individual', value: 521, color: '#FDCB6E' },
      ]}
      centerValue="2,714" centerLabel="entities"
      source="Entity Resolution (100% coverage)"
    />
  ),
}
