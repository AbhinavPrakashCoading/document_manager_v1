import { sscRegistry } from '../src/schema/ssc';
import axios from 'axios';

export const SSCConfig = {
  requirements: sscRegistry.versions[0].requirements,
  endpoints: {
    base: 'https://ssc.gov.in/',
    notifications: 'api/notices',
    documents: 'api/document-requirements'
  },
  // Configuration for automatic updates
  updateConfig: {
    checkIntervalHours: 24,
    lastChecked: null as string | null,
    async checkForUpdates() {
      try {
        const response = await axios.get(`${SSCConfig.endpoints.base}${SSCConfig.endpoints.documents}`);
        const newRequirements = response.data;
        
        // If requirements have changed, create a new version
        if (JSON.stringify(newRequirements) !== JSON.stringify(SSCConfig.requirements)) {
          const newVersion = {
            version: `${new Date().getFullYear()}.${sscRegistry.versions.length + 1}`,
            lastUpdated: new Date().toISOString(),
            source: 'ssc-api',
            requirements: newRequirements
          };
          sscRegistry.versions.push(newVersion);
          sscRegistry.defaultVersion = newVersion.version;
          SSCConfig.requirements = newRequirements;
        }
        
        SSCConfig.updateConfig.lastChecked = new Date().toISOString();
        return true;
      } catch (error) {
        console.warn('Failed to check for SSC requirement updates:', error);
        // Use fallback if update check fails
        if (!SSCConfig.requirements) {
          SSCConfig.requirements = sscRegistry.fallback.requirements;
        }
        return false;
      }
    }
  }
};
