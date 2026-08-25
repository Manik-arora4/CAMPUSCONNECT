/**
 * Connector Registry.
 * Central place to register all opportunity source connectors.
 * Adding a new source = adding a new connector here.
 */

import { IITDelhiConnector, IITMadrasConnector, IITRoorkeeConnector, IITBombayConnector, IITKanpurConnector, IITKharagpurConnector, IITHyderabadConnector, IITGuwahatiConnector } from './iit-connectors.js';
import { NIT_TRICHY, NIT_WARANGAL, NIT_CALICUT, NIT_SURATHKAL, NIT_ROURKELA, IIIT_HYDERABAD, IIIT_ALLAHABAD, IIIT_BANGALORE, IIIT_DELHI, IIIT_DHARWAD, IIIT_RANCHI } from './nit-iiit-connectors.js';
import { InternshalaConnector, GovScholarshipConnector, MyGovConnector, KaggleConnector, GoogleEducationConnector } from './platform-connectors.js';
import {
  UnstopConnector, LinkedInJobsConnector, WellfoundConnector,
  DRDOConnector, ISROConnector, CSIRConnector,
  IIM_AHMEDABAD, IIM_BANGALORE, IIM_CALCUTTA, IIM_LUCKNOW,
  GovInternshipPortalConnector,
  DU_DELHI, JNU_DELHI, BHU_VARANASI, AMU_ALIGARH,
} from './additional-platforms.js';

/**
 * All registered connectors.
 * To add a new source, simply add a new instance here.
 */
export const connectors = [
  // ─── IITs ───
  new IITDelhiConnector(),
  new IITMadrasConnector(),
  new IITRoorkeeConnector(),
  new IITBombayConnector(),
  new IITKanpurConnector(),
  new IITKharagpurConnector(),
  new IITHyderabadConnector(),
  new IITGuwahatiConnector(),

  // ─── NITs ───
  NIT_TRICHY,
  NIT_WARANGAL,
  NIT_CALICUT,
  NIT_SURATHKAL,
  NIT_ROURKELA,

  // ─── IIITs ───
  IIIT_HYDERABAD,
  IIIT_ALLAHABAD,
  IIIT_BANGALORE,
  IIIT_DELHI,
  IIIT_DHARWAD,
  IIIT_RANCHI,

  // ─── IIMs ───
  IIM_AHMEDABAD,
  IIM_BANGALORE,
  IIM_CALCUTTA,
  IIM_LUCKNOW,

  // ─── Central Universities ───
  DU_DELHI,
  JNU_DELHI,
  BHU_VARANASI,
  AMU_ALIGARH,

  // ─── Government Organizations ───
  new DRDOConnector(),
  new ISROConnector(),
  new CSIRConnector(),
  new GovScholarshipConnector(),
  new GovInternshipPortalConnector(),
  new MyGovConnector(),

  // ─── Platforms ───
  new InternshalaConnector(),
  new UnstopConnector(),
  new KaggleConnector(),
  new GoogleEducationConnector(),
  new LinkedInJobsConnector(),
  new WellfoundConnector(),
];

/**
 * Get a connector by ID.
 */
export function getConnector(id) {
  return connectors.find((c) => c.id === id);
}

/**
 * Get all connector IDs.
 */
export function getConnectorIds() {
  return connectors.map((c) => c.id);
}
