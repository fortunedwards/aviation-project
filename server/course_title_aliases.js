const TITLE_ALIASES = [
  {
    canonical: 'Flight Dispatcher/Flight Operations Officer (Basic) (FDB)',
    aliases: [
      'Flight Dispatcher/ Flight Operations Officer Course (BASIC)',
      'Flight Dispatcher/Flight Operations Officer Course (BASIC)',
      'Flight Dispatcher/Flight Operations Officer (Basic)',
    ],
  },
  {
    canonical: 'Flight Dispatcher/Flight Operations Officer (Advanced) (FDA)',
    aliases: [
      'Flight Dispatcher/ Flight Operations Officer Course (ADVANCED)',
      'Flight Dispatcher/Flight Operations Officer Course (ADVANCED)',
      'Flight Dispatcher/Flight Operations Officer (Advanced)',
    ],
  },
  {
    canonical: 'Cabin Crew (Initial) Training (CCI)',
    aliases: [
      'Cabin Crew (Ab-Initio) Training Course',
      'Cabin Crew (Ab Initio) Training Course',
      'Senior Cabin Crew Supervisory/Pursers Training',
    ],
  },
  {
    canonical: 'Cabin Crew Conversion/Refresher Training (CCC/CCR) (B737 Classic)',
    aliases: ['Cabin Crew Recurrent Course (B737 Classic)'],
  },
  {
    canonical: 'Basic Aircraft Maintenance Technicians Course (BATCO)',
    aliases: [
      'Basic Aircraft (Maintenance) Technicians Course (BATCO)',
      'Aircraft Structural Repairs',
      'Aircraft Wheels And Brakes',
      'Non-Destructive Testing (NDT) Course',
    ],
  },
  {
    canonical: 'Aircraft Maintenance Licence Preparatory Course (AMLPC) (Avionics)',
    aliases: [
      'Aircraft Maintenance License Preparatory Course (Avionics)',
      'EWIS. Electrical Wiring Interconnection Systems',
    ],
  },
  {
    canonical: 'Aircraft Maintenance Licence Preparatory Course (AMLPC) (A&P)',
    aliases: ['Aircraft Maintenance License Preparatory Course (Airframe & Powerplant)'],
  },
  {
    canonical: 'B737-200 Type Training (Maintenance: Initial) Course',
    aliases: ['B737-200 Type Training (Maintenance) Initial'],
  },
  {
    canonical: 'B737 Classic (300/400/500) Type Training (Maintenance: Initial) Course',
    aliases: ['B737-300/400/500 (Classic) Type Training (Maintenance) Initial'],
  },
  {
    canonical: 'B737 Classic/NG Differences Course',
    aliases: ['B737NG Classic/NG Differential Course'],
  },
  {
    canonical: 'Bombardier CRJ-700/705/900/1000 Type Training (Maintenance: Initial) Course',
    aliases: ['Bombardier CRJ-700/705/900/1000 Type Training (Maintenance: Initial) Course'],
  },
  {
    canonical: 'DHC 8 (Q-400) Type Training (Maintenance: Initial) Course',
    aliases: ['DHC 8 (Q-400) Type Training (Maintenance: Initial)'],
  },
  {
    canonical: 'ERJ-135,145/Legacy 600/650 Type Training (Maintenance: Initial) Course',
    aliases: ['ERJ-135,145/Legacy -600/650 Type Training (Maintenance: Initial)'],
  },
  {
    canonical: 'Accountable Managers Course (AMC)',
    aliases: ['Accountable Managers Course'],
  },
  {
    canonical: 'Human Factors In Operations (HFO)',
    aliases: ['Advanced Human Factors', 'Human Performance & Limitations for Airline Operations Personnel'],
  },
  {
    canonical: 'Aircraft Maintenance Planning and Control (AMPC)',
    aliases: ['Advanced Maintenance Planning Techniques'],
  },
  {
    canonical: 'Quality Management Systems for Airlines (QMS)',
    aliases: ['Advanced Quality Management System', 'Risk Based Thinking in Quality Management'],
  },
  {
    canonical: 'Aircraft Maintenance Management (AMM)',
    aliases: ['Enhancing Your Maintenance Standards', 'Root Cause Analysis In Maintenance Operations'],
  },
  {
    canonical: 'Safety Management Systems (SMS)',
    aliases: [
      'Aviation Business Continuity Planning (ABCP) and Disaster Recovery Planning (DRP)',
      'Practical Application of SMS',
      'Physical and Environmental Security in Aviation',
    ],
  },
  {
    canonical: 'Air Cargo Operations Management (ACRG)',
    aliases: ['Cargo and Baggage Handling', 'Loadmasters Course'],
  },
  {
    canonical: 'Airworthiness Course (AWC)',
    aliases: ['Continuing Airworthiness Assurance'],
  },
  {
    canonical: 'Ramp Services Course (RSC)',
    aliases: ['Aircraft Fuelling Into Aircraft Technical Procedures', 'Ground Operations Course', 'Ramp Services Course'],
  },
  {
    canonical: 'Flight Operations Management (FOM)',
    aliases: ['Flight Operations Management', 'International Flight Planning'],
  },
  {
    canonical: 'Flight Operations Quality Assurance (FOQA)',
    aliases: ['Flight Operations Quality Assurance (Flight Data Analysis)'],
  },
  {
    canonical: 'Fuel Tank Safety (FTS)',
    aliases: ['Fuel Quality Assurance Course', 'Fuel Tank Safety'],
  },
  {
    canonical: 'Introduction to Aircraft Maintenance Management for the Financial Sector',
    aliases: ['Introduction to Aircraft Maintenance Management for the Financial Sector'],
  },
  {
    canonical: 'Introduction to Aviation Management (AVM)',
    aliases: ['Introduction to Aviation Management'],
  },
  {
    canonical: 'Management Of Air Navigation Systems And Safety (MANS)',
    aliases: ['Management of Air Navigation Systems and Safety', 'Information Security Governance and Risk Management in Government'],
  },
  {
    canonical: 'Regulations For Engineers: Interpreting And Understanding Nig.CARs (RFE)',
    aliases: ['Air Law (Regulations) for Engineers-(Interpreting and Understanding Nig.CARs 2023)'],
  },
  {
    canonical: 'Regulations For Pilots: Interpreting And Understanding Nig.CARs (RFP)',
    aliases: ['Air Law (Regulations) for Pilots-(Interpreting and Understanding Nig.CARs 2023)'],
  },
  {
    canonical: 'Minimum Equipment List Course (MEL)',
    aliases: ['Minimum Equipment List (MEL) Training.'],
  },
  {
    canonical: 'Nominated/Designated Postholders Training (NPH)',
    aliases: ['Nominated/Designated Post Holders (NPH) Training'],
  },
  {
    canonical: 'Principles and Methods of Accident Prevention (AP)',
    aliases: ['Principles and Methods of Accident Prevention'],
  },
  {
    canonical: 'Aircraft Maintenance Programmes (AMP)',
    aliases: ['Maintenance Programme Optimization', 'Required Inspection Item (RII)'],
  },
  {
    canonical: 'Quality Auditing Techniques (QAT)',
    aliases: ['Regulatory Quality'],
  },
  {
    canonical: 'Crew Resource Management (CRM)',
    aliases: ['Time and Stress Management in Workplace', 'Crew Resource Management'],
  },
  {
    canonical: 'Train - The - Trainers (TTT)',
    aliases: ['Train - the - Trainer', 'Train the Trainer'],
  },
  {
    canonical: 'Carriage of Dangerous Goods Regulations (CDRG)',
    aliases: ['Carriage of Dangerous Goods'],
  },
  {
    canonical: 'Chief Pilots Course (CPC)',
    aliases: ['Chief Pilots Course'],
  },
  {
    canonical: 'Customer Service Orientation Course (CSO)',
    aliases: ['Customer Service Orientation Course (CSO) Course'],
  },
  {
    canonical: 'Dispatch Resource Management (DRM)',
    aliases: ['Dispatch Resource Management (DRM) for Flight Operations Officers'],
  },
  {
    canonical: 'Engineering Managers Course (EMC)',
    aliases: ['Engineering Managers Course'],
  },
  {
    canonical: 'Basic Meteorology (Aeromet) (BMA)',
    aliases: ['Basic Meteorology (Aeromet)'],
  },
  {
    canonical: 'Flight Operations Quality Assurance (FOQA)',
    aliases: ['Flight Data Analysis'],
  },
];

function normalizeTitle(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[’'`]/g, '')
    .replace(/[–—]/g, '-')
    .replace(/&/g, ' and ')
    .replace(/\blicen[cs]e\b/gi, 'licence')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function buildTitleResolver(frontendTitles) {
  const frontendByNormalized = new Map();

  for (const title of frontendTitles) {
    frontendByNormalized.set(normalizeTitle(title), title);
  }

  const aliasByNormalized = new Map();

  for (const { canonical, aliases } of TITLE_ALIASES) {
    const normalizedCanonical = normalizeTitle(canonical);
    if (!frontendByNormalized.has(normalizedCanonical)) {
      continue;
    }

    aliasByNormalized.set(normalizedCanonical, canonical);
    for (const alias of aliases) {
      aliasByNormalized.set(normalizeTitle(alias), canonical);
    }
  }

  return (dbTitle) => {
    const normalizedTitle = normalizeTitle(dbTitle);
    return frontendByNormalized.get(normalizedTitle) || aliasByNormalized.get(normalizedTitle) || null;
  };
}

module.exports = {
  TITLE_ALIASES,
  buildTitleResolver,
  normalizeTitle,
};
