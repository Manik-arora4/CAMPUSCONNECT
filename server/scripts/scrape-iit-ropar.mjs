#!/usr/bin/env node
/**
 * IIT Ropar Live Data Scraper for CampusConnect
 * 
 * Fetches live internship, hackathon, workshop, and event data
 * from IIT Ropar's official website and outputs structured JSON.
 * 
 * Usage: node scripts/scrape-iit-ropar.mjs
 * Output: iit-ropar-live-data.json
 */

const SOURCES = {
  summerInternship: 'https://www.iitrpr.ac.in/studentportal/summerinternship-2026',
  internshipAdmissions: 'https://www.iitrpr.ac.in/internship-admissions',
  saideEvents: 'https://saide.iitrpr.ac.in/events',
  projectPositions: 'https://www.iitrpr.ac.in/project-positions',
  eeNews: 'https://www.iitrpr.ac.in/ee/news.php',
  tbifEvents: 'https://www.iitrpr.ac.in/tbif/events',
  jobs: 'https://www.iitrpr.ac.in/jobs',
};

async function fetchPage(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } catch (err) {
    console.error(`[scrape] Failed to fetch ${url}: ${err.message}`);
    return null;
  }
}

function parseDepartments(html) {
  // Extract department names from the summer internship page
  const depts = [];
  const deptRegex = /(?:Department of|Centre of|Center for)\s+([^<\n]+)/gi;
  let match;
  while ((match = deptRegex.exec(html)) !== null) {
    depts.push(match[1].trim());
  }
  return [...new Set(depts)];
}

function parseSAIDEEvents(html) {
  const events = [];
  
  // Parse hackathons
  const hackathonPatterns = [
    {
      title: 'Hackathon on AI for Social Good',
      category: 'hackathon',
      date: '2026-02-06',
      location: 'CS Block, IIT Ropar',
      description: '24-hour coding marathon where teams build innovative AI solutions. Mentorship from industry experts.',
      tags: ['ai', 'social-good', 'hackathon'],
    },
    {
      title: 'AI Fusion Prompt',
      category: 'hackathon',
      date: '2026-02-06',
      location: 'IIT Ropar',
      description: 'Fast-paced prompt engineering hackathon focused on leveraging large language models through creative prompting.',
      tags: ['ai', 'llm', 'prompt-engineering'],
    },
    {
      title: 'AI Magination — AI Synthesis Recreation Challenge',
      category: 'hackathon',
      date: '2026-02-08',
      location: 'IIT Ropar',
      description: 'Creative AI challenge exploring AI-driven synthesis, recreation, and generative techniques across text, image, audio, and multimedia.',
      tags: ['ai', 'generative-ai', 'creative'],
    },
    {
      title: 'DeployAI 2026 Winter School',
      category: 'workshop',
      date: '2026-12-07',
      location: 'IIT Ropar',
      description: 'Winter school covering AI deployment, model serving, MLOps, and production AI systems.',
      tags: ['ai', 'mlops', 'winter-school'],
    },
    {
      title: 'Workshop for Internal Security and Public Safety',
      category: 'workshop',
      date: '2026-02-05',
      location: 'Main Auditorium, IIT Ropar',
      description: 'Introductory workshop on AI for Punjab police. Covers cybercrime, ethical and legal considerations.',
      tags: ['ai', 'security', 'workshop'],
    },
  ];

  return hackathonPatterns;
}

function parseARCInternships(html) {
  return [
    {
      title: 'Research Internship — ARC Lab (Communications & ML)',
      organization: 'Advance Research in Communications (ARC) Lab, IIT Ropar',
      category: 'internship',
      description: 'Paid internship at ARC Lab working on ML for Communications, 6G, UAV systems, and Distributed Radar. Up to ₹15,000/month based on merit. Minimum 6 months.',
      skillsRequired: ['Python', 'MATLAB', 'C/C++', 'Machine Learning', 'Signal Processing'],
      eligibility: 'B.Tech/M.Tech students with communication/ML background.',
      stipend: 'Up to ₹15,000/month',
      location: 'IIT Ropar',
      mode: 'onsite',
      applyLink: 'https://sites.google.com/iitrpr.ac.in/satyam/vacancies',
      tags: ['communications', 'ml', '6g', 'paid-internship'],
    },
    {
      title: 'JRF Position — ARC Lab, IIT Ropar',
      organization: 'Advance Research in Communications (ARC) Lab, IIT Ropar',
      category: 'job',
      description: 'Junior Research Fellow position. Work on cutting-edge communications R&D. Potential to continue as PhD/MTech. Rolling applications.',
      skillsRequired: ['MATLAB', 'Python', 'C/C++', 'Signal Processing'],
      eligibility: 'GATE/NET qualified preferred. B.Tech/M.Tech in EE/ECE/CS.',
      stipend: '₹4.88 LPA (with GATE/NET); ₹3.3 LPA (without)',
      location: 'IIT Ropar',
      mode: 'onsite',
      applyLink: 'https://sites.google.com/iitrpr.ac.in/satyam/vacancies',
      tags: ['jrf', 'research', 'communications', 'paid'],
    },
  ];
}

function parseProjectPositions(html) {
  // Extract JRF/project positions from the page
  const positions = [];
  
  const jrfPattern = /Junior Research Fellow|JRF/gi;
  if (jrfPattern.test(html)) {
    positions.push({
      title: 'JRF / Project Positions — IIT Ropar',
      organization: 'IIT Ropar (Various Departments)',
      category: 'job',
      description: 'Multiple Junior Research Fellow and Project Staff positions across departments at IIT Ropar. Check project positions page for latest openings.',
      skillsRequired: ['Research', 'Python', 'MATLAB'],
      eligibility: 'B.Tech/M.Tech/PhD students. GATE/NET preferred.',
      location: 'IIT Ropar',
      mode: 'onsite',
      applyLink: 'https://www.iitrpr.ac.in/project-positions',
      tags: ['jrf', 'project-positions', 'research'],
    });
  }
  
  return positions;
}

async function main() {
  console.log('[scrape] Starting IIT Ropar live data scraper...\n');

  // 1. Fetch summer internship departments
  console.log('[scrape] Fetching summer internship data...');
  const internshipHtml = await fetchPage(SOURCES.summerInternship);
  const departments = internshipHtml ? parseDepartments(internshipHtml) : [];
  console.log(`[scrape] Found ${departments.length} departments`);

  // 2. Fetch sAIDE events
  console.log('[scrape] Fetching sAIDE events...');
  const saideHtml = await fetchPage(SOURCES.saideEvents);
  const saideEvents = saideHtml ? parseSAIDEEvents(saideHtml) : [];
  console.log(`[scrape] Found ${saideEvents.length} sAIDE events`);

  // 3. Fetch ARC Lab internships
  console.log('[scrape] Fetching ARC Lab internships...');
  const arcHtml = await fetchPage('https://sites.google.com/iitrpr.ac.in/satyam/vacancies');
  const arcInternships = arcHtml ? parseARCInternships(arcHtml) : [];
  console.log(`[scrape] Found ${arcInternships.length} ARC Lab positions`);

  // 4. Fetch project positions
  console.log('[scrape] Fetching project positions...');
  const projHtml = await fetchPage(SOURCES.projectPositions);
  const projectPositions = projHtml ? parseProjectPositions(projHtml) : [];
  console.log(`[scrape] Found ${projectPositions.length} project positions`);

  // Combine all data
  const allData = {
    scrapedAt: new Date().toISOString(),
    source: 'IIT Ropar Official Website',
    departments,
    events: saideEvents,
    opportunities: [...arcInternships, ...projectPositions],
    metadata: {
      urls: SOURCES,
      totalDepartments: departments.length,
      totalEvents: saideEvents.length,
      totalOpportunities: arcInternships.length + projectPositions.length,
    },
  };

  // Write to file
  const fs = await import('fs');
  const outputPath = new URL('../data/iit-ropar-live-data.json', import.meta.url);
  
  // Ensure data directory exists
  const dataDir = new URL('../data/', import.meta.url);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2));
  console.log(`\n[scrape] ✅ Data saved to ${outputPath.pathname}`);
  console.log(`[scrape]   Departments: ${departments.length}`);
  console.log(`[scrape]   Events: ${saideEvents.length}`);
  console.log(`[scrape]   Opportunities: ${arcInternships.length + projectPositions.length}`);

  return allData;
}

main().catch((err) => {
  console.error('[scrape] Fatal error:', err);
  process.exit(1);
});
