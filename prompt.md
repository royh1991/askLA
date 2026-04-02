# askLA Civic Intelligence Platform — Dashboard Rebuild Spec

## Vision

Rebuild the `/dashboard` route as a USAFacts-style civic data platform for Los Angeles, combining the question-answer format of usafacts.org with Y2K minimalist aesthetics inspired by goshippo.com. Every visualization is backed by real data from 24 Postgres tables (2.19M rows). Text should feel alive using `@chenglou/pretext` for layout measurement and dynamic reflow. Assets (hero illustrations, section icons) are generated via Gemini (`$GEMINI_API_KEY`).

## Reference Sites

### USAFacts (usafacts.org) — Content & Data Model
- **Homepage**: Hero with bold tagline ("Answers straight from the source"), featured cards (3-col: Viz Lab, Interactive Video, Report), trending section, articles grid with question-format cards, newsletter CTA, fast facts ticker
- **Answer pages** (e.g. /answers/how-many-job-openings/): Full-bleed colored hero with question as H1, category label (ECONOMY), isometric illustration. Below: big hero numbers (6.88M, 360K) with context labels, source citation link, explanatory paragraph, then a large time-series line chart with recession shading bands, axis labels, source watermark
- **Government spending** (/government-spending/): Hero with "Government" in pink, isometric capitol building illustration. Then a massive full-width **Sankey/flow diagram** — revenue sources (blue blocks, left) flowing through a central "Revenue/Spending/Deficit" spine into spending categories (purple blocks, right), with drill-down into subcategories. Each block shows dollar amount + label. Revenue: Individual Income Taxes $2.4T, Social Security Taxes $1.3T, Payroll Taxes $1.7T, Corporate Income Taxes $530B, etc. Spending: Social Security $1.3T, Defense $1.3T, Medicare $874B, etc.
- **Question-answer card format**: Icon (isometric illustration), question as headline ("How many job openings are there in the US?"), update frequency label ("Updates monthly"), clickable

### GoShippo (goshippo.com) — Y2K Minimalist Aesthetic
- **Monochromatic palette**: Single hue family at different saturations. No gradients, no glassmorphism
- **Sharp-cornered cards with thick black borders**: 3px solid black, 0px border-radius — deliberately anti-modern
- **Flat color blocks**: Solid fills, no shadows, no blur effects. Sections alternate between two shades
- **Bold oversized typography**: 64px H1 in geometric sans (Rethink Sans), body in Neue Haas Unica
- **Minimal decoration**: No background patterns, no floating elements. Graph-paper grid motif in some sections
- **8px base unit**: All spacing is multiples of 8
- **Two button styles**: Solid dark teal fill + outline black border, both 8px radius

## Design System for askLA

### Color Palette (Y2K Minimalist — monochromatic per section)

Each domain section gets its own single-hue palette (two shades: saturated + pastel). The page alternates between them like goshippo.com.

| Domain | Saturated | Pastel | Text on Saturated |
|--------|-----------|--------|-------------------|
| MONEY | `#6C5CE7` (electric violet) | `#E8E4F8` (lavender wash) | white |
| SAFETY | `#E84855` (coral red) | `#FDE8EA` (rose wash) | white |
| HOUSING | `#00B894` (mint) | `#E0F8F1` (mint wash) | white |
| PEOPLE | `#0984E3` (cerulean) | `#E0F0FF` (sky wash) | white |
| INFRASTRUCTURE | `#FDCB6E` (gold) | `#FFF8E7` (cream) | black |
| GOVERNANCE | `#00CEC9` (teal) | `#E0FFFE` (ice wash) | white |

**Neutrals:**
- Background: `#FAFAFA` (off-white)
- Card bg: `#FFFFFF`
- Card border: `3px solid #1A1A1A` (thick black, goshippo-style)
- Text primary: `#1A1A1A`
- Text secondary: `#6B7280`
- Accent (CTA): `#E84855` (USAFacts pink-red for subscribe/CTA buttons)

### Typography

- **H1 Display**: `Rethink Sans` (Google Fonts), 700, 56-64px — section hero titles
- **H2 Questions**: `Rethink Sans`, 700, 32-40px — question headlines on answer cards
- **Body**: `DM Sans` (Google Fonts), 400/500, 16-18px
- **Data numbers**: `Azeret Mono`, 700, 48-72px — big hero metrics
- **Labels/captions**: `Azeret Mono`, 500, 11-12px, uppercase, letter-spacing 2px
- **Pretext-rendered text**: `DM Sans`, 400, 16px — dynamically measured and reflowed

### Borders & Shapes (goshippo-inspired)
- Cards: **0px border-radius, 3px solid black border** — the Y2K signature
- Buttons: 8px border-radius
- Hero sections: full-bleed, no border-radius
- Chart containers: 0px border-radius, light gray background (#F5F5F0)

### Spacing
- Base unit: 8px
- Section padding: 64px vertical
- Card padding: 32px
- Grid gap: 24px
- Max content width: 1200px

## Page Structure

### 1. HERO SECTION
Full-width, `#6C5CE7` (violet) background.

**Left side:**
- "askLA" wordmark (large, white)
- Tagline: "Answers straight from the source. The data LA deserves." — 48px Rethink Sans, white
- Word "Answers" has a pink highlight box behind it (USAFacts style)
- Subtitle: "24 tables. 2.19M rows. 30+ data sources. 18 years of city records." — 16px DM Sans

**Right side:**
- Gemini-generated isometric illustration of LA City Hall (similar to USAFacts' black/gray isometric style)
- Rotating question card (white, sharp corners, 3px black border) showing sample questions:
  - "Where does LA spend $13.2B?"
  - "Who gets $1.42B in homelessness funds?"
  - "Which nonprofits are 100% city-dependent?"

**Pretext usage**: The tagline text dynamically reflows as viewport resizes, measured by `prepareWithSegments()` + `layoutWithLines()` for smooth, jank-free line breaks. No layout thrashing.

### 2. FAST FACTS TICKER (Pretext-powered)
Horizontal scrolling band below hero. White background, thin top/bottom borders.

Uses `@chenglou/pretext` to measure each fact's pixel width without DOM, then renders a seamless CSS-animated scroll loop.

Facts pulled from real data (cycle through all of these):
- "LAHSA received $1.42B in city grants"
- "621,677 traffic collisions since 2020"
- "388,645 campaign donations tracked"
- "13,277 buildings need retrofit by April 2026"
- "MV Transportation: $779M classified as 'grants' to a for-profit"
- "67% soft-story compliance rate"
- "$46M in council discretionary funds"
- "Top-decile pollution tracts: 3-8pp higher asthma rates"
- "78 nonprofits where city grants exceed 50% of revenue"
- "LAPD budget: $2.14B adopted, but overtime and settlements push it higher"
- "$384M in LAPD settlements, many approved with zero council discussion"
- "3M+ RIPA stops recorded by LAPD"
- "1.5M 311 requests filed by Angelenos"
- "$208M/yr in parking revenue from 34,245 meters"
- "10,698 council meetings transcribed since 2008"
- "Benford's Law flags anomalous payment patterns in 6 departments"
- "24.3M parking citations issued"
- "199,740 nonprofits registered in California"
- "Vision Zero failed: traffic fatalities up 60%"
- "2,714 grant recipients resolved to entity type — 100% coverage"

### 3. FEATURED CARDS (3-column, USAFacts-style)
Three large cards with bold color backgrounds, sharp corners, 3px black border. These rotate/highlight the most compelling investigations:

1. **THE MONEY TRAIL** (violet bg) — "Follow $7B in city spending from source to recipient. Who lobbies, donates, and gets contracts?" — icon: isometric money/ledger — links to ACCOUNTABILITY section
2. **THE HOUSING CRISIS** (mint bg) — "$1.8B spent on homelessness. 13,277 unreinforced buildings. Where is LA building, and who profits?" — icon: isometric apartment building — links to HOUSING section
3. **POLICING THE POLICE** (navy bg) — "$2.14B budget, $384M in settlements, and overtime as an off-books budget expansion" — icon: isometric police badge — links to POLICING section

Each card has: category label (uppercase, small), headline, description, arrow link button.

### 3b. TRENDING QUESTIONS (horizontal scroll, USAFacts-style)
Below featured cards, a horizontally scrollable row of trending question cards (smaller format):
- "Where does LA's $13.2B budget go?"
- "Do city payments follow Benford's Law?"
- "Has Vision Zero reduced traffic fatalities?"
- "Which nonprofits are 100% city-dependent?"
- "Is LAPD overtime an off-books budget expansion?"
- "Do polluted neighborhoods get less city investment?"
- "How much mansion tax revenue has Measure ULA generated?"
- "What do Angelenos complain about most on 311?"

### 4. DOMAIN SECTIONS (10 sections, alternating colors)

Each domain section follows this pattern:
1. **Section hero**: Full-width colored band with domain name in large pink text (USAFacts-style), isometric illustration on right, description paragraph
2. **Question cards grid**: 3-column grid of question-answer cards (the core content)
3. **Featured visualization**: One large chart for the domain's signature dataset

Expanded color palette for 10 sections:

| Domain | Saturated | Pastel |
|--------|-----------|--------|
| BUDGET & SPENDING | `#6C5CE7` (violet) | `#E8E4F8` |
| ACCOUNTABILITY | `#D63031` (crimson) | `#FDE8E8` |
| CAMPAIGN FINANCE | `#A855F7` (purple) | `#F3E8FF` |
| POLICING & JUSTICE | `#1E3A5F` (navy) | `#E0E8F0` |
| SAFETY | `#E84855` (coral) | `#FDE8EA` |
| HOUSING & HOMELESSNESS | `#00B894` (mint) | `#E0F8F1` |
| PEOPLE & DEMOGRAPHICS | `#0984E3` (cerulean) | `#E0F0FF` |
| HEALTH & ENVIRONMENT | `#00CEC9` (teal) | `#E0FFFE` |
| INFRASTRUCTURE | `#FDCB6E` (gold) | `#FFF8E7` |
| GOVERNANCE | `#636E72` (slate) | `#F0F0F0` |

---

#### Section 4a: BUDGET & SPENDING (violet)
**Hero**: "Budget & Spending" — isometric city hall with money flowing
**Description**: "Where does LA's $13.2B go? Track every dollar from revenue source to department to vendor."

| # | Question | Data Source | Chart Type | Hero Number |
|---|----------|-----------|------------|-------------|
| 1 | Where does LA's $13.2B budget go? | `city_budget` | **Sankey flow diagram** (USAFacts spending style) — revenue sources → department spending | $13.2B |
| 2 | Who are the top recipients of city grants? | `checkbook_transactions` + `entities` | Horizontal bar chart — top 20 vendors by total received | $7.0B |
| 3 | How much does each department spend? | `city_budget` | Stacked bar chart — spending by department over fiscal years | $13.2B |
| 4 | How much do council members control in discretionary funds? | `discretionary_spending` | Grouped bar chart — $ per district, 15 bars | $46M |
| 5 | Which council districts get the most discretionary money? | `discretionary_spending` | Ranked horizontal bars — district by total, with per-capita overlay | $46M |
| 6 | Who receives discretionary fund grants? | `discretionary_spending` | Treemap — recipients by amount, colored by district | $46M |
| 7 | How has the city budget grown over time? | `city_budget` | Area chart — total budget by fiscal year, stacked by fund type | $13.2B |
| 8 | What's the breakdown of city revenue sources? | `city_budget` | Donut chart — revenue by fund type (General Fund, Special, Enterprise) | — |
| 9 | How much does the city spend on homelessness programs? | `homelessness_spending` | Stacked bar — spending by category and year | $1.8B |
| 10 | Which vendors dominate city spending by department? | `checkbook_transactions` | HHI concentration bar — departments colored by monopoly risk (HHI > 2500) | — |

**Signature viz**: Full-width **Sankey flow diagram** of LA city budget. Left: revenue sources. Right: department spending. Click to drill into subcategories.

---

#### Section 4b: ACCOUNTABILITY & FORENSICS (crimson)
**Hero**: "Accountability" — isometric magnifying glass over ledger
**Description**: "8 forensic detection algorithms scan $7B in city spending for anomalies. Benford's Law, duplicate payments, split transactions, and shell company indicators — the same methods used by federal auditors."

| # | Question | Data Source | Chart Type | Hero Number |
|---|----------|-----------|------------|-------------|
| 1 | Do city payments follow Benford's Law? | `checkbook_transactions` (forensics) | Bar chart — expected vs. actual first-digit distribution, flagged deviations | — |
| 2 | How many duplicate payments has the city made? | `checkbook_transactions` (forensics) | Table + timeline — same vendor + amount within 7 days | — |
| 3 | Are vendors splitting invoices to stay under approval thresholds? | `checkbook_transactions` (forensics) | Histogram — payment clusters below $5K/$25K/$50K/$100K thresholds | — |
| 4 | Does the city spend more at the end of fiscal years? | `checkbook_transactions` (forensics) | Line chart — monthly spending with fiscal month 11-12 highlighted (use-it-or-lose-it) | — |
| 5 | Which vendors got big payments but few transactions? | `checkbook_transactions` (forensics) | Scatter plot — transaction count vs. total $ (large one-off = shell company risk) | — |
| 6 | Do multiple vendors share the same zip code? | `checkbook_transactions` (forensics) | Network graph or table — vendor address clustering | — |
| 7 | Which nonprofits receive more city money than their annual revenue? | `entities` + `irs_bmf` | Scatter plot — city grants as % of nonprofit revenue (dots above 100% line) | 78 |
| 8 | Is the city paying dissolved nonprofits? | `entities` + `irs_bmf` + `checkbook_transactions` | Table — payments to orgs with revoked IRS status | — |
| 9 | What's the "Money Triangle"? Who lobbies, donates, AND gets contracts? | `entities` + `campaign_contributions` + `lobbying_payments` | **Venn diagram or 3-set intersection table** — the full influence pipeline | — |
| 10 | How much did MV Transportation really get, and why is it classified as "grants"? | `checkbook_transactions` + `lobbying_projects` + `entities` | Timeline + bar — $779M in payments, 30+ lobbying filings | $779M |

**Signature viz**: Interactive **Benford's Law dashboard** — select any department or vendor, see first-digit distribution vs. expected, with MAD (Mean Absolute Deviation) score and conformity rating.

---

#### Section 4c: CAMPAIGN FINANCE (purple)
**Hero**: "Campaign Finance" — isometric ballot box with dollar signs
**Description**: "388K donations, 289K expenditures, and the overlap between who donates and who gets city contracts."

| # | Question | Data Source | Chart Type | Hero Number |
|---|----------|-----------|------------|-------------|
| 1 | How much money flows into LA city campaigns? | `campaign_contributions` | Area chart — total donations by year, stacked by seat type | $88.2M |
| 2 | Who are the biggest donors to LA campaigns? | `campaign_contributions` | Horizontal bar — top 20 donors by total contributed | — |
| 3 | Which candidates raise the most money? | `campaign_contributions` | Horizontal bar — top candidates by total raised | — |
| 4 | How are campaign funds spent? | `campaign_expenditures` | Treemap — spending by category (Media, Consulting, Fundraising, Print, Salary) | $71.4M |
| 5 | Do campaign donors get city contracts? | `campaign_contributions` + `entities` | Overlap table — entities that appear in both donations and grants | — |
| 6 | Do organizations that donate also hire lobbyists? | `campaign_contributions` + `lobbying_payments` | Venn/overlap — donor-lobbyist intersection | — |
| 7 | Do discretionary fund recipients donate to their council member? | `discretionary_spending` + `campaign_contributions` | Correlation chart — per-district comparison of donors vs. fund recipients | — |
| 8 | What does the lobbying-to-spending pipeline look like? | `lobbying_payments` + `lobbying_projects` + `checkbook_transactions` | **Sankey** — lobbying firms → departments lobbied → spending to lobbyist clients | $175M |
| 9 | Which departments are most heavily lobbied? | `lobbying_projects` | Horizontal bar — projects by department_lobbied | 234K |
| 10 | How much do lobbying firms charge their clients? | `lobbying_payments` | Grouped bar — top firms by total payments received | $175M |

**Signature viz**: **Campaign finance flow** — Sankey from top donors → candidates → expenditure categories. Shows where money comes from and where it goes.

---

#### Section 4d: POLICING & JUSTICE (navy)
**Hero**: "Policing & Justice" — isometric police badge and courthouse
**Description**: "LA's $2.14B police budget, 621K collisions, RIPA stop data, and the gap between adopted budgets and actual spending."

| # | Question | Data Source | Chart Type | Hero Number |
|---|----------|-----------|------------|-------------|
| 1 | How much does LA really spend on policing? | `city_budget` + `checkbook_transactions` | Stacked bar — adopted LAPD budget vs. actual (including overtime, reserve fund transfers) | $2.14B |
| 2 | Is LAPD overtime an off-books budget expansion? | `checkbook_transactions` (POLICE dept) | Line chart — overtime spending by fiscal month, year-end spikes highlighted | — |
| 3 | How much has LA paid in police settlements? | `council_files` + meeting transcripts | Bar chart — settlement $ by year, average discussion time per settlement | $384M |
| 4 | How many people are stopped by LAPD, and who? | RIPA Stops (`5gp9-8nrb`) | Stacked bar — stops by race, with population comparison line | 3M+ |
| 5 | What does LAPD arrest data show? | Arrests (`amvf-fr72`) | Line chart — arrests by year, broken down by charge type | — |
| 6 | How many calls for service does LAPD handle? | LAPD Calls (`xjgu-z4ju`) | Area chart — calls by month, by call type | — |
| 7 | What are the trends in custodial deaths? | `deaths_in_custody` | Stacked area chart — deaths by year, colored by manner (natural, suicide, homicide, other) | 320 |
| 8 | Which agencies have the most custodial deaths? | `deaths_in_custody` | Horizontal bar — top agencies, with per-capita rate | — |
| 9 | Are custodial deaths disproportionate by race? | `deaths_in_custody` | Grouped bar — deaths by race vs. population share | — |
| 10 | How does LAPD spending compare to other departments? | `city_budget` | Proportional area chart — LAPD vs. Fire vs. Public Works vs. all others | — |

**Signature viz**: **LAPD Budget Deep Dive** — adopted vs. actual spending over 5 years, with overtime and settlement overlays showing the true cost of policing.

---

#### Section 4e: SAFETY (coral)
**Hero**: "Safety" — isometric traffic light and ambulance
**Description**: "621K traffic collisions, Vision Zero failures, earthquake preparedness, and LAFD response times."

| # | Question | Data Source | Chart Type | Hero Number |
|---|----------|-----------|------------|-------------|
| 1 | How many traffic collisions happen in LA each year? | `traffic_collisions` | Line chart — USAFacts style with COVID period shading | 621K |
| 2 | Has Vision Zero reduced traffic fatalities? | `traffic_collisions` | Line chart — fatalities over time (spoiler: up 60%) | +60% |
| 3 | Which neighborhoods have the most collisions? | `traffic_collisions` | Horizontal bar — top 15 LAPD areas by collision count | — |
| 4 | Who are the victims of traffic collisions? | `traffic_collisions` | Demographic breakdown — age/sex/descent grouped bars | — |
| 5 | Where do pedestrian fatalities happen? | `traffic_collisions` | Dot map or area bar — pedestrian deaths by location | — |
| 6 | How many earthquakes hit near LA? | `earthquakes` | Scatter plot — magnitude vs. time, dot size = magnitude | 188 |
| 7 | Are soft-story buildings ready for the next earthquake? | `soft_story_permits` + `calenviroscreen` | Map overlay — unreinforced buildings in high-seismic-risk tracts | 13,277 |
| 8 | How fast does LAFD respond? | LAFD Response (`n44u-wxe4`) | Histogram — response time distribution, with 5-min target line | — |

**Signature viz**: **Traffic collision trends** — large time-series chart showing collisions, injuries, and fatalities over 5 years, with COVID dip and recovery visible.

---

#### Section 4f: HOUSING & HOMELESSNESS (mint)
**Hero**: "Housing" — isometric apartment building with construction crane
**Description**: "Where is LA building? Who gets $1.8B in homelessness funds? And will 13,277 buildings be retrofitted before the earthquake deadline?"

| # | Question | Data Source | Chart Type | Hero Number |
|---|----------|-----------|------------|-------------|
| 1 | Where is new housing being built? | `building_permits` | Vertical bar — permits by year + map by zip code | 25,715 |
| 2 | What types of housing are being built? | `building_permits` | Stacked bar — permits by type (single-family, multi-family, ADU) | — |
| 3 | How much mansion tax revenue has Measure ULA generated? | `ula_revenue` | Area chart — cumulative revenue, with property type breakdown | $312M |
| 4 | Which council districts generate the most ULA revenue? | `ula_revenue` | Horizontal bar — revenue by district | — |
| 5 | How many buildings need earthquake retrofit? | `soft_story_permits` | Gauge — % compliance with April 2026 deadline countdown | 67% |
| 6 | Where are the unreinforced buildings? | `soft_story_permits` | Map or area chart — buildings by neighborhood/zip | 13,277 |
| 7 | Where does $1.8B in homelessness spending go? | `homelessness_spending` | **Treemap** — by vendor (LAHSA dominates at $1.42B) and category | $1.8B |
| 8 | Does the Abundant Blessings pattern repeat? Multi-layered grant fraud? | `homelessness_spending` + `entities` + `irs_bmf` | Table — intermediaries where grants >> revenue, high officer compensation | — |
| 9 | Which homelessness vendors have the highest overhead? | `entities` + `irs_bmf` (990 data) | Scatter — program expense ratio vs. total grants received | — |
| 10 | How many rent-stabilized units exist? | Rent Stabilization (`qcdq-7wse`) | Bar chart — units by area | — |
| 11 | How many eviction notices are filed? | Eviction Notices (`5gje-qfrz`) | Line chart — evictions by month, with COVID moratorium period | — |
| 12 | Where is affordable housing being built? | Affordable Housing (`mymu-zi3s`) | Map + bar — units by neighborhood and funding source | — |

**Signature viz**: **Homelessness spending treemap** — nested rectangles showing where $1.8B goes: LAHSA ($1.42B) dominates, drill into subcategories to see vendor-level detail.

---

#### Section 4g: PEOPLE & DEMOGRAPHICS (cerulean)
**Hero**: "People" — isometric diverse community
**Description**: "10 million people across 2,498 census tracts. Income inequality, poverty rates, and who has access to what."

| # | Question | Data Source | Chart Type | Hero Number |
|---|----------|-----------|------------|-------------|
| 1 | What does LA County look like demographically? | `census_acs_tracts` | Stacked horizontal bar — race/ethnicity breakdown with comparison to city average | 10.0M |
| 2 | What's the income distribution across LA? | `census_acs_tracts` | Histogram — median income by tract, with poverty line marked | — |
| 3 | Where are the highest-poverty neighborhoods? | `census_acs_tracts` | Ranked bar — top 20 tracts by poverty rate | — |
| 4 | Which communities lack vehicle access? | `census_acs_tracts` | Bar chart — % no-vehicle households by tract, transit-dependent communities | — |
| 5 | How does income vary by race in LA? | `census_acs_tracts` | Grouped bar — median income by racial majority of tract | — |
| 6 | Where do non-English speakers live? | `census_acs_tracts` | Heat grid — linguistic isolation by tract | — |

**Signature viz**: **Income inequality map** — choropleth of LA County tracts colored by median income, with poverty overlay toggle.

---

#### Section 4h: HEALTH & ENVIRONMENT (teal)
**Hero**: "Health & Environment" — isometric lungs/tree with factory
**Description**: "The most polluted census tracts have 3-8 percentage points higher rates of asthma, diabetes, and depression. Here's the data."

| # | Question | Data Source | Chart Type | Hero Number |
|---|----------|-----------|------------|-------------|
| 1 | Do polluted neighborhoods have worse health outcomes? | `calenviroscreen` + `cdc_places` + `census_acs_tracts` | **Dual-axis step chart** — pollution decile vs. avg health burden (monotonic relationship) | YES |
| 2 | Which census tracts have the worst environmental burden? | `calenviroscreen` | Ranked bar — top 20 tracts by CES score | 8,035 |
| 3 | What are the asthma rates across LA? | `cdc_places` | Heat grid — asthma prevalence by tract | — |
| 4 | How do diabetes rates correlate with poverty? | `cdc_places` + `census_acs_tracts` | Scatter plot — diabetes rate vs. poverty rate, with regression line | — |
| 5 | Where is air pollution worst? | `calenviroscreen` | Bar chart — PM2.5 and diesel exposure by decile | — |
| 6 | Does the city invest less in polluted neighborhoods? | `calenviroscreen` + `checkbook_transactions` | Scatter — CES score vs. per-tract city spending (the inequality question) | — |
| 7 | Does council spending on fentanyl/overdose match the rhetoric? | `checkbook_transactions` + `cdc_places` + meeting transcripts | Dual chart — council mentions of "fentanyl" over time vs. actual program spending | — |
| 8 | What are LA's water supply sources? | DWP Water Supply (`qyvz-diiw`) | Stacked area — water by source (LA Aqueduct, MWD, groundwater, recycled) | — |
| 9 | How often do power outages happen? | DWP Power Outages (`r95y-gwez`) | Line chart — outages by month with duration and customers affected | — |

**Signature viz**: **Environmental justice dashboard** — pollution decile on X-axis, health outcomes + income + poverty on Y-axis, showing the monotonic relationship between environmental burden and human outcomes.

---

#### Section 4i: INFRASTRUCTURE & SERVICES (gold)
**Hero**: "Infrastructure" — isometric road with parking meter and fire hydrant
**Description**: "34K parking meters, 1.5M 311 requests, and the physical fabric of Los Angeles."

| # | Question | Data Source | Chart Type | Hero Number |
|---|----------|-----------|------------|-------------|
| 1 | How many parking meters does LA have? | `parking_meters` | Donut — by meter type (single, double, multi-space) + map | 34,245 |
| 2 | How much parking revenue does LA collect? | `parking_meters` + parking citations | Stacked bar — meter revenue + citation revenue by year | $208M/yr |
| 3 | What do Angelenos complain about most? | MyLA311 (`73a2-6ar5`) | Horizontal bar — top 20 service request types | 1.5M |
| 4 | Which neighborhoods file the most 311 requests? | MyLA311 | Heat map — requests by area/zip, per-capita normalized | — |
| 5 | How fast does the city respond to 311 requests? | MyLA311 | Histogram — response time distribution by request type | — |
| 6 | Where are LA's historic preservation zones? | `hpoz_boundaries` | Map + stat card | 35 |
| 7 | How many cultural facilities does LA maintain? | `cultural_facilities` | List with details + stat | 30 |
| 8 | What are Business Improvement Districts? | `bid_boundaries` | Stat card — count + total annual assessments | 42 BIDs, $65M/yr |
| 9 | How many parking citations are issued? | Parking Citations (`4f5p-udkv`) | Line chart — citations by month, top violation types | 24.3M |
| 10 | How many active businesses operate in LA? | Active Businesses (`6rrh-rzua`) | Area chart — active business licenses over time | — |

**Signature viz**: **311 requests treemap** — 1.5M requests broken down by type, colored by average response time (green = fast, red = slow).

---

#### Section 4j: GOVERNANCE & LEGISLATION (slate)
**Hero**: "Governance" — isometric gavel with document stack
**Description**: "390 council files tracked, 10,698 meetings transcribed, 20.9M words of public discourse. What is the council actually working on?"

| # | Question | Data Source | Chart Type | Hero Number |
|---|----------|-----------|------------|-------------|
| 1 | What legislation is the council working on? | `council_files` | Timeline — files by month, categorized by topic (housing, policing, settlements, cannabis) | 390 |
| 2 | How many council meetings happen each year? | meeting metadata | Bar chart — meetings by year and type (council, committee) | 10,698 |
| 3 | Which topics dominate council discussions? | meeting transcripts | Word cloud or bar — topic frequency from transcript analysis | 20.9M words |
| 4 | How much time does council spend on settlements? | `council_files` + transcripts | Scatter — settlement $ vs. discussion word count (high-dollar, zero-discussion items) | $384M |
| 5 | How many nonprofits operate in California? | `irs_bmf` | Donut — by NTEE category (Human Services, Education, Health, Arts, Religion) | 199K |
| 6 | Which nonprofits have the most revenue? | `irs_bmf` | Horizontal bar — top 20 CA nonprofits by revenue | — |
| 7 | What types of entities receive city money? | `entities` | Donut — for-profit (47.9%), nonprofit (21.8%), government (30%), individual (0.3%) | 2,714 |
| 8 | How were 2,714 grant recipients identified? | `entities` | Funnel chart — resolution sources (IRS BMF 746, ProPublica 219, manual 218, pattern rest) | 100% resolved |
| 9 | What federal grants does LA receive? | USASpending data | Bar chart — federal grants by agency and program | — |
| 10 | How much city payroll costs taxpayers? | Payroll (`g9h8-fvhu`) | Stacked bar — payroll by department, overtime highlighted | 686K records |

**Signature viz**: **Entity resolution Sankey** — how 2,714 grant recipients were classified: raw vendor names → resolution method → entity type → total dollars received.

---

### 5. NEWSLETTER / CTA SECTION
White background, centered layout (USAFacts-style):
- Icon: isometric envelope
- Headline: "LA's government is complex. Our data doesn't have to be."
- Subtitle: "Subscribe for weekly data-backed answers about your city."
- Email input + pink submit button

### 6. FOOTER
Minimal. Links to data sources, GitHub, methodology. "Built on 24 Postgres tables, 2.19M rows, 30+ public data sources."

## Pretext Integration (Required — Must Be Visible)

### 1. Hero Tagline Reflow
The hero tagline uses `prepareWithSegments()` + `layoutWithLines()` to calculate line breaks at any width. On resize, text reflows instantly without DOM measurement. This enables smooth responsive behavior and precise typographic control.

### 2. Fast Facts Ticker
Each fact string is measured with `prepareWithSegments()` + `layoutWithLines()` at a very large width to get single-line pixel widths. These widths drive a seamless Framer Motion scroll animation — total scroll distance is known before render, so the loop is perfectly timed.

### 3. Question Card Text Fitting
Each question card headline uses `prepare()` + `layout()` to predict text height at the card's width. Cards with longer questions get slightly more padding automatically. This prevents text overflow and ensures visual consistency across the grid without CSS clamp hacks.

### 4. Dynamic Chart Annotations
Chart labels and annotations use pretext to measure text before rendering, ensuring labels never overlap axes or each other. This is especially important for the Sankey diagram where dozens of labels must fit without collision.

## Gemini Asset Generation

Use `$GEMINI_API_KEY` (Gemini Flash image generation) to create:

1. **10 isometric section illustrations** (one per domain) — style: black + gray + one accent color, isometric perspective, simple geometric shapes, USAFacts-inspired
   - BUDGET & SPENDING: City hall with money flowing through departments
   - ACCOUNTABILITY: Magnifying glass over ledger with red flags
   - CAMPAIGN FINANCE: Ballot box with dollar signs flowing in/out
   - POLICING & JUSTICE: Police badge with courthouse
   - SAFETY: Traffic light with ambulance
   - HOUSING & HOMELESSNESS: Apartment building with construction crane
   - PEOPLE & DEMOGRAPHICS: Diverse community silhouettes
   - HEALTH & ENVIRONMENT: Lungs/tree next to factory smokestacks
   - INFRASTRUCTURE: Road with parking meter and fire hydrant
   - GOVERNANCE: Gavel with document stack

2. **~90 question card icons** — smaller isometric icons for each question card, matching the section's accent color

3. **Hero illustration** — larger composite showing LA skyline in isometric

**Generation prompt template:**
```
Create a simple isometric illustration of [SUBJECT] in a flat, minimal style.
Use only black, dark gray (#333), light gray (#CCC), and [ACCENT_COLOR].
White background. No text. No shadows. Clean geometric shapes.
Style reference: USAFacts.org isometric illustrations.
PNG, 400x400px, transparent background.
```

**Generation script**: Create `app/scripts/generate-assets.ts` that:
1. Reads section/question definitions
2. Calls Gemini image generation API for each
3. Saves to `app/public/sprites/dashboard/`
4. Generates a manifest of all assets

## Chart Implementation

### Hand-Rolled SVG Charts (no chart libraries)
All charts are hand-rolled SVG with Framer Motion animations:

1. **Line chart** (USAFacts-style): SVG path with area fill, Y-axis labels, X-axis dates, optional gray recession/event bands, source citation, draw-in animation via `pathLength`
2. **Horizontal bar chart**: Sorted bars with labels, animated grow-in
3. **Vertical bar chart**: Time series bars with year labels
4. **Sankey flow diagram**: The signature visualization. Revenue blocks (left) → spending blocks (right) with curved SVG paths connecting them. Each block is clickable to drill down. Modeled directly after USAFacts' government spending page.
5. **Donut chart**: Ring with animated stroke-dashoffset reveal
6. **Treemap**: Nested rectangles with labels, proportional sizing
7. **Scatter plot**: Dots with size encoding, animated fade-in
8. **Gauge/progress**: Semicircular arc showing % completion
9. **Heat grid**: Small colored cells showing intensity

### Chart Styling
- Background: `#F5F5F0` (warm off-white, like USAFacts chart bg)
- Grid lines: `#E5E5E0` (very subtle)
- Axis text: `Azeret Mono`, 11px, `#6B7280`
- Data color: domain accent color
- Annotations: `DM Sans`, 13px
- Source citation: bottom-left, `DM Sans`, 12px, with arrow link
- Logo watermark: bottom-right (USAFacts puts their logo there)

## Tech Stack

- **Framework**: Next.js 16 App Router, TypeScript
- **Styling**: Tailwind CSS 4 + inline styles for Y2K-specific elements
- **Animation**: Framer Motion — entrance animations, chart draw-in, ticker scroll
- **Text measurement**: `@chenglou/pretext` — hero reflow, ticker widths, card text fitting, chart label collision avoidance
- **Charts**: Hand-rolled SVG (no D3, no Recharts, no chart libraries)
- **Assets**: Gemini-generated isometric illustrations via `$GEMINI_API_KEY`
- **Fonts**: Google Fonts — Rethink Sans (display), DM Sans (body), Azeret Mono (data)
- **Data**: Mock data initially, wired to Neon Postgres API routes later

## File Structure

```
app/src/app/dashboard/
├── layout.tsx              — fonts, page chrome
├── page.tsx                — main page: hero, ticker, featured cards, domain sections
├── components/
│   ├── Hero.tsx            — hero section with pretext tagline reflow
│   ├── Ticker.tsx          — pretext-powered scrolling facts
│   ├── FeaturedCards.tsx    — 3-column featured cards
│   ├── DomainSection.tsx   — reusable section wrapper (hero + questions + viz)
│   ├── QuestionCard.tsx    — individual question card with icon, pretext text fitting
│   ├── AnswerView.tsx      — expanded answer with big numbers + chart
│   └── Newsletter.tsx      — CTA section
├── charts/
│   ├── LineChart.tsx        — USAFacts-style time series
│   ├── BarChart.tsx         — horizontal + vertical bars
│   ├── SankeyDiagram.tsx    — the signature budget flow viz
│   ├── DonutChart.tsx       — ring chart
│   ├── Treemap.tsx          — nested rectangles
│   ├── ScatterPlot.tsx      — dot plot
│   ├── Gauge.tsx            — progress arc
│   └── HeatGrid.tsx         — intensity grid
├── data/
│   ├── questions.ts         — all question definitions with mock data
│   └── sections.ts          — domain section configs
└── lib/
    └── pretext.ts           — pretext utility hooks (useTextLayout, useTextWidth)
```

## Implementation Order

1. **Phase 1**: Layout + Hero + Ticker (pretext integration from day 1)
2. **Phase 2**: Domain sections with question cards (mock data)
3. **Phase 3**: Chart components (LineChart, BarChart, Sankey first)
4. **Phase 4**: Gemini asset generation script
5. **Phase 5**: Wire to Neon Postgres API routes
6. **Phase 6**: Answer detail views (click question → full chart + analysis)

## Key Design Principles

1. **Questions first**: Every piece of data is framed as a question an Angeleno would ask
2. **Y2K minimalist**: Flat colors, thick borders, sharp corners, bold type, no decoration
3. **Text feels alive**: Pretext measures everything — text reflows, tickers scroll precisely, labels never collide
4. **Data is the decoration**: Big numbers, clean charts, and honest data replace ornamental design
5. **Source everything**: Every chart has a source citation (like USAFacts)
6. **Monochromatic sections**: Each domain gets one hue at two saturations, alternating down the page
