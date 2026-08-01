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
    aliases: ['Cabin Crew (Ab-Initio) Training Course', 'Cabin Crew (Ab Initio) Training Course'],
  },
  {
    canonical: 'Cabin Crew Conversion/Refresher Training (CCC/CCR) (B737 Classic)',
    aliases: ['Cabin Crew Recurrent Course (B737 Classic)'],
  },
  {
    canonical: 'Basic Aircraft Maintenance Technicians Course (BATCO)',
    aliases: ['Basic Aircraft (Maintenance) Technicians Course (BATCO)'],
  },
  {
    canonical: 'Aircraft Maintenance Licence Preparatory Course (AMLPC) (Avionics)',
    aliases: ['Aircraft Maintenance License Preparatory Course (Avionics)'],
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
    canonical: 'Regulations For Engineers: Interpreting And Understanding Nig.CARs (RFE)',
    aliases: ['Air Law (Regulations) for Engineers-(Interpreting and Understanding Nig.CARs 2023)'],
  },
  {
    canonical: 'Regulations For Pilots: Interpreting And Understanding Nig.CARs (RFP)',
    aliases: ['Air Law (Regulations) for Pilots-(Interpreting and Understanding Nig.CARs 2023)'],
  },
  {
    canonical: 'Basic Meteorology (Aeromet) (BMA)',
    aliases: ['Basic Meteorology (Aeromet)'],
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
    canonical: 'Crew Resource Management (CRM)',
    aliases: ['Crew Resource Management'],
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
    canonical: 'Flight Operations Management (FOM)',
    aliases: ['Flight Operations Management'],
  },
  {
    canonical: 'Flight Operations Quality Assurance (FOQA)',
    aliases: ['Flight Operations Quality Assurance (Flight Data Analysis)'],
  },
  {
    canonical: 'Fuel Tank Safety (FTS)',
    aliases: ['Fuel Tank Safety'],
  },
  {
    canonical: 'Helicopter Landing Officers Course (HLO)',
    aliases: ['Helicopter Landing Officers Course (HLO)'],
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
    aliases: ['Management of Air Navigation Systems and Safety'],
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
    canonical: 'Ramp Services Course (RSC)',
    aliases: ['Ramp Services Course'],
  },
  {
    canonical: 'Safety Management Systems (SMS)',
    aliases: ['Safety Management Systems (SMS)', 'Practical Application of SMS'],
  },
  {
    canonical: 'Train - The - Trainers (TTT)',
    aliases: ['Train – the – Trainer', 'Train - the - Trainer', 'Train the Trainer'],
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
