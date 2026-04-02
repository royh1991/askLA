import { NextRequest, NextResponse } from 'next/server'

// Lazy-load pg to avoid bundling issues
let pool: any = null

async function getPool() {
  if (pool) return pool
  const { Pool } = await import('pg')
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
  })
  return pool
}

// Predefined safe queries by key — prevents SQL injection
const QUERIES: Record<string, { sql: string; description: string }> = {
  // BUDGET
  'budget-by-dept': {
    sql: `SELECT department_name, SUM(budget_amount) as total
          FROM city_budget WHERE budget_amount > 0
          GROUP BY department_name ORDER BY total DESC LIMIT 15`,
    description: 'City budget by department',
  },
  'budget-by-year': {
    sql: `SELECT fiscal_year, SUM(budget_amount) as total
          FROM city_budget WHERE budget_amount > 0
          GROUP BY fiscal_year ORDER BY fiscal_year`,
    description: 'City budget by fiscal year',
  },
  'top-vendors': {
    sql: `SELECT vendor_name, SUM(dollar_amount) as total, COUNT(*) as txn_count
          FROM checkbook_transactions WHERE dollar_amount > 0
          GROUP BY vendor_name ORDER BY total DESC LIMIT 20`,
    description: 'Top grant recipients',
  },
  'discretionary-by-district': {
    sql: `SELECT council_district, SUM(amount) as total, COUNT(*) as grants
          FROM discretionary_spending WHERE amount > 0
          GROUP BY council_district ORDER BY council_district`,
    description: 'Discretionary spending by district',
  },

  // CAMPAIGN
  'donations-by-year': {
    sql: `SELECT EXTRACT(YEAR FROM con_date::date) as year, SUM(con_amount) as total, COUNT(*) as donations
          FROM campaign_contributions WHERE con_amount > 0
          GROUP BY year ORDER BY year`,
    description: 'Campaign donations by year',
  },
  'top-donors': {
    sql: `SELECT con_name, SUM(con_amount) as total, COUNT(*) as donations
          FROM campaign_contributions WHERE con_amount > 0
          GROUP BY con_name ORDER BY total DESC LIMIT 20`,
    description: 'Top campaign donors',
  },
  'expenditures-by-type': {
    sql: `SELECT exp_type, SUM(exp_amount) as total, COUNT(*) as count
          FROM campaign_expenditures WHERE exp_amount > 0
          GROUP BY exp_type ORDER BY total DESC LIMIT 10`,
    description: 'Campaign expenditures by type',
  },
  'lobbying-by-dept': {
    sql: `SELECT department_lobbied, COUNT(*) as projects
          FROM lobbying_projects WHERE department_lobbied IS NOT NULL
          GROUP BY department_lobbied ORDER BY projects DESC LIMIT 15`,
    description: 'Most lobbied departments',
  },
  'lobbying-top-clients': {
    sql: `SELECT client_name, SUM(payment_amount) as total
          FROM lobbying_payments WHERE payment_amount > 0
          GROUP BY client_name ORDER BY total DESC LIMIT 15`,
    description: 'Top lobbying clients',
  },

  // SAFETY
  'collisions-by-year': {
    sql: `SELECT EXTRACT(YEAR FROM date_occurred::date) as year, COUNT(*) as total
          FROM traffic_collisions
          GROUP BY year ORDER BY year`,
    description: 'Traffic collisions by year',
  },
  'collisions-by-area': {
    sql: `SELECT area_name, COUNT(*) as total
          FROM traffic_collisions WHERE area_name IS NOT NULL
          GROUP BY area_name ORDER BY total DESC LIMIT 15`,
    description: 'Collisions by LAPD area',
  },
  'earthquakes': {
    sql: `SELECT magnitude, place, lat, lon, depth
          FROM earthquakes ORDER BY magnitude DESC`,
    description: 'Earthquakes near LA',
  },
  'deaths-by-year': {
    sql: `SELECT year, manner_of_death, COUNT(*) as total
          FROM deaths_in_custody
          GROUP BY year, manner_of_death ORDER BY year`,
    description: 'Custodial deaths by year and manner',
  },

  // HOUSING
  'permits-by-year': {
    sql: `SELECT EXTRACT(YEAR FROM issue_date::date) as year, COUNT(*) as total,
          SUM(COALESCE(residential_units, 0)::int) as units
          FROM building_permits WHERE issue_date IS NOT NULL
          GROUP BY year ORDER BY year`,
    description: 'Building permits by year',
  },
  'homelessness-by-vendor': {
    sql: `SELECT vendor_name, SUM(amount) as total, category
          FROM homelessness_spending WHERE amount > 0
          GROUP BY vendor_name, category ORDER BY total DESC LIMIT 15`,
    description: 'Homelessness spending by vendor',
  },
  'ula-revenue': {
    sql: `SELECT recording_date, transfer_tax_amount, consideration_amount, zip_code
          FROM ula_revenue WHERE transfer_tax_amount > 0
          ORDER BY recording_date`,
    description: 'ULA mansion tax transactions',
  },
  'soft-story-status': {
    sql: `SELECT status, COUNT(*) as total
          FROM soft_story_permits
          GROUP BY status ORDER BY total DESC`,
    description: 'Soft-story retrofit compliance status',
  },

  // PEOPLE
  'demographics': {
    sql: `SELECT SUM(total_pop) as total_pop, SUM(white) as white, SUM(black) as black,
          SUM(hispanic) as hispanic, AVG(median_income) as avg_income, AVG(poverty) as avg_poverty
          FROM census_acs_tracts`,
    description: 'LA County demographics summary',
  },
  'income-distribution': {
    sql: `SELECT median_income, poverty, total_pop, tract
          FROM census_acs_tracts WHERE median_income > 0
          ORDER BY median_income`,
    description: 'Income distribution by tract',
  },

  // HEALTH & ENVIRONMENT
  'enviro-by-decile': {
    sql: `SELECT ces.ci_decile,
          AVG(cdc.data_value) as avg_health_burden,
          AVG(acs.median_income) as avg_income,
          AVG(acs.poverty) as avg_poverty
          FROM calenviroscreen ces
          LEFT JOIN cdc_places cdc ON cdc.locationid = ces.tract
          LEFT JOIN census_acs_tracts acs ON acs.tract = SUBSTRING(ces.tract FROM 5)
          WHERE ces.tract::text LIKE '6037%'
          GROUP BY ces.ci_decile ORDER BY ces.ci_decile`,
    description: 'Environmental burden by pollution decile',
  },

  // ENTITIES
  'entity-types': {
    sql: `SELECT entity_type, COUNT(*) as count, SUM(total_received) as total_received
          FROM entities
          GROUP BY entity_type ORDER BY total_received DESC`,
    description: 'Entity types receiving city money',
  },
  'nonprofits-by-ntee': {
    sql: `SELECT SUBSTRING(ntee_code, 1, 1) as category, COUNT(*) as count,
          SUM(revenue_amount) as total_revenue
          FROM irs_bmf WHERE ntee_code IS NOT NULL
          GROUP BY category ORDER BY count DESC LIMIT 10`,
    description: 'CA nonprofits by NTEE category',
  },

  // GOVERNANCE
  'council-files-by-month': {
    sql: `SELECT EXTRACT(YEAR FROM date_received::date) as year,
          EXTRACT(MONTH FROM date_received::date) as month,
          COUNT(*) as total
          FROM council_files WHERE date_received IS NOT NULL
          GROUP BY year, month ORDER BY year, month`,
    description: 'Council files by month',
  },

  // TABLE COUNTS
  'table-counts': {
    sql: `SELECT 'campaign_contributions' as t, COUNT(*) as n FROM campaign_contributions
          UNION ALL SELECT 'traffic_collisions', COUNT(*) FROM traffic_collisions
          UNION ALL SELECT 'campaign_expenditures', COUNT(*) FROM campaign_expenditures
          UNION ALL SELECT 'lobbying_projects', COUNT(*) FROM lobbying_projects
          UNION ALL SELECT 'lobbying_payments', COUNT(*) FROM lobbying_payments
          UNION ALL SELECT 'city_budget', COUNT(*) FROM city_budget
          UNION ALL SELECT 'checkbook_transactions', COUNT(*) FROM checkbook_transactions
          UNION ALL SELECT 'homelessness_spending', COUNT(*) FROM homelessness_spending
          UNION ALL SELECT 'discretionary_spending', COUNT(*) FROM discretionary_spending
          UNION ALL SELECT 'building_permits', COUNT(*) FROM building_permits
          UNION ALL SELECT 'entities', COUNT(*) FROM entities
          UNION ALL SELECT 'irs_bmf', COUNT(*) FROM irs_bmf
          UNION ALL SELECT 'calenviroscreen', COUNT(*) FROM calenviroscreen
          UNION ALL SELECT 'census_acs_tracts', COUNT(*) FROM census_acs_tracts
          UNION ALL SELECT 'council_files', COUNT(*) FROM council_files
          UNION ALL SELECT 'deaths_in_custody', COUNT(*) FROM deaths_in_custody
          UNION ALL SELECT 'earthquakes', COUNT(*) FROM earthquakes
          ORDER BY n DESC`,
    description: 'Row counts for all tables',
  },
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const queryKey = searchParams.get('q')

  if (!queryKey) {
    return NextResponse.json({
      error: 'Missing ?q= parameter',
      available: Object.keys(QUERIES).map(k => ({ key: k, description: QUERIES[k].description })),
    }, { status: 400 })
  }

  const queryDef = QUERIES[queryKey]
  if (!queryDef) {
    return NextResponse.json({
      error: `Unknown query: ${queryKey}`,
      available: Object.keys(QUERIES),
    }, { status: 400 })
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'DATABASE_URL not configured' }, { status: 500 })
  }

  try {
    const p = await getPool()
    const result = await p.query(queryDef.sql)
    return NextResponse.json({
      query: queryKey,
      description: queryDef.description,
      rowCount: result.rowCount,
      rows: result.rows,
    })
  } catch (err: any) {
    return NextResponse.json({
      error: err.message,
      query: queryKey,
    }, { status: 500 })
  }
}
