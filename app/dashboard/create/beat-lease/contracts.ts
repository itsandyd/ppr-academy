/**
 * Beat Lease Contracts - Legal Templates
 */

import { LeaseType, BeatLeaseData } from "./types";

export interface ContractTerms {
  // Usage rights
  commercialUse: boolean;
  distributionLimit?: number;
  streamingLimit?: number;
  radioPlay: boolean;
  musicVideos: boolean;
  performanceRights: boolean;
  
  // Files included
  mp3Included: boolean;
  wavIncluded: boolean;
  stemsIncluded: boolean;
  trackoutsIncluded: boolean;
  
  // Legal terms
  exclusivityPeriod?: number; // days
  creditRequired: boolean;
  creditFormat: string; // "Prod. by [Producer]"
  resaleRights: boolean;
  
  // Revenue sharing (for exclusive)
  publishingShare?: number; // percentage
  masterShare?: number; // percentage
}

export const CONTRACT_TEMPLATES: Record<LeaseType, ContractTerms> = {
  free: {
    commercialUse: false,
    distributionLimit: 1000,
    streamingLimit: 10000,
    radioPlay: false,
    musicVideos: false,
    performanceRights: false,
    mp3Included: true,
    wavIncluded: false,
    stemsIncluded: false,
    trackoutsIncluded: false,
    creditRequired: true,
    creditFormat: "Prod. by [Producer]",
    resaleRights: false,
  },
  
  basic: {
    commercialUse: true,
    distributionLimit: 5000,
    streamingLimit: 100000,
    radioPlay: true,
    musicVideos: true,
    performanceRights: true,
    mp3Included: true,
    wavIncluded: true,
    stemsIncluded: false,
    trackoutsIncluded: false,
    creditRequired: true,
    creditFormat: "Prod. by [Producer]",
    resaleRights: false,
  },
  
  premium: {
    commercialUse: true,
    distributionLimit: 50000,
    streamingLimit: 1000000,
    radioPlay: true,
    musicVideos: true,
    performanceRights: true,
    mp3Included: true,
    wavIncluded: true,
    stemsIncluded: true,
    trackoutsIncluded: false,
    creditRequired: true,
    creditFormat: "Prod. by [Producer]",
    resaleRights: false,
  },
  
  exclusive: {
    commercialUse: true,
    // No limits for exclusive
    radioPlay: true,
    musicVideos: true,
    performanceRights: true,
    mp3Included: true,
    wavIncluded: true,
    stemsIncluded: true,
    trackoutsIncluded: true,
    creditRequired: false, // Optional for exclusive
    creditFormat: "Prod. by [Producer]",
    resaleRights: true,
    publishingShare: 50, // 50/50 split
    masterShare: 50,
  },
};

export function generateContract(
  beatData: BeatLeaseData, 
  leaseType: LeaseType, 
  buyerInfo: { name: string; email: string }
): string {
  const terms = CONTRACT_TEMPLATES[leaseType];
  const producer = beatData.producerTag || "Producer";
  const beatTitle = beatData.title || "Untitled Beat";
  const date = new Date().toLocaleDateString();

  return `
BEAT LEASE AGREEMENT

Date: ${date}
Beat Title: "${beatTitle}"
Producer: ${producer}
Licensee: ${buyerInfo.name} (${buyerInfo.email})
License Type: ${leaseType.toUpperCase()} LICENSE

1. GRANT OF RIGHTS
The Producer grants the Licensee a non-exclusive license to use the Beat subject to the terms below:

2. USAGE RIGHTS
${terms.commercialUse ? '✓' : '✗'} Commercial Use
${terms.radioPlay ? '✓' : '✗'} Radio/Broadcast Play
${terms.musicVideos ? '✓' : '✗'} Music Videos
${terms.performanceRights ? '✓' : '✗'} Live Performances

3. DISTRIBUTION LIMITS
${terms.distributionLimit ? `• Maximum ${terms.distributionLimit.toLocaleString()} copies sold/distributed` : '• No distribution limit'}
${terms.streamingLimit ? `• Maximum ${terms.streamingLimit.toLocaleString()} streams` : '• No streaming limit'}

4. FILES INCLUDED
${terms.mp3Included ? '✓' : '✗'} MP3 File (320kbps)
${terms.wavIncluded ? '✓' : '✗'} WAV File (24-bit/44.1kHz)
${terms.stemsIncluded ? '✓' : '✗'} Stems (Individual tracks)
${terms.trackoutsIncluded ? '✓' : '✗'} Trackouts (Full project)

5. CREDIT REQUIREMENTS
${terms.creditRequired ? `• Credit required: "${terms.creditFormat.replace('[Producer]', producer)}"` : '• Credit not required (optional)'}

6. EXCLUSIVITY
${leaseType === 'exclusive' 
  ? '• EXCLUSIVE LICENSE: Producer cannot sell this beat to anyone else'
  : terms.exclusivityPeriod 
    ? `• Beat may be sold to others after ${terms.exclusivityPeriod} days`
    : '• Beat may be sold to other artists simultaneously'
}

${leaseType === 'exclusive' && terms.publishingShare ? `
7. REVENUE SHARING (Exclusive Only)
• Publishing: ${terms.publishingShare}% Licensee / ${100 - terms.publishingShare}% Producer
• Master Recording: ${terms.masterShare}% Licensee / ${100 - terms.masterShare}% Producer
` : ''}

8. RESTRICTIONS
• Licensee may NOT resell, redistribute, or lease the Beat to third parties
• Licensee may NOT claim ownership of the Beat composition
${!terms.resaleRights ? '• Licensee may NOT use the Beat for sync licensing without additional agreement' : ''}

9. TERMINATION
This license remains in effect until terminated by either party with 30 days written notice.

10. GOVERNING LAW
This agreement is governed by the laws of [Your State/Country].

By purchasing this license, both parties agree to the terms above.

Producer: ${producer}
Licensee: ${buyerInfo.name}
Date: ${date}

---
Generated automatically by PPR Academy
Beat ID: ${beatData.title?.toLowerCase().replace(/\s+/g, '-') || 'untitled'}
License: ${leaseType.toUpperCase()}
  `.trim();
}

export function getContractPreview(beatData: BeatLeaseData, leaseType: LeaseType): string {
  return generateContract(beatData, leaseType, { 
    name: "[Artist Name]", 
    email: "[artist@email.com]" 
  });
}
