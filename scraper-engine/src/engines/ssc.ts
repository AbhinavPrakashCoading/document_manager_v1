import { SSCConfig } from '../../config/ssc';
import { sscRegistry } from '../schema/ssc';

export async function scrapeSSC() {
  try {
    // Check for updates if it's been more than checkIntervalHours
    const lastChecked = SSCConfig.updateConfig.lastChecked ? new Date(SSCConfig.updateConfig.lastChecked) : null;
    const hoursElapsed = lastChecked ? (Date.now() - lastChecked.getTime()) / (1000 * 60 * 60) : Infinity;
    
    if (hoursElapsed >= SSCConfig.updateConfig.checkIntervalHours) {
      await SSCConfig.updateConfig.checkForUpdates();
    }

    // Get the latest requirements (will use fallback if main requirements are unavailable)
    const requirements = SSCConfig.requirements || sscRegistry.fallback.requirements;
    
    return [
      {
        ...requirements.photo,
        raw: JSON.stringify(requirements.photo.additional)
      },
      {
        ...requirements.signature,
        raw: JSON.stringify(requirements.signature.additional)
      },
      {
        ...requirements.documents,
        raw: JSON.stringify(requirements.documents.required)
      }
    ];

    // Find notices related to exams/applications
    return [
      {
        ...SSCConfig.requirements.photo,
        raw: JSON.stringify(SSCConfig.requirements.photo.additional)
      },
      {
        ...SSCConfig.requirements.signature,
        raw: JSON.stringify(SSCConfig.requirements.signature.additional)
      },
      {
        ...SSCConfig.requirements.documents,
        raw: JSON.stringify(SSCConfig.requirements.documents.required)
      }
    ];
  } catch (err) {
    console.error('SSC scrape failed:', err);
    return [];
  }
}
