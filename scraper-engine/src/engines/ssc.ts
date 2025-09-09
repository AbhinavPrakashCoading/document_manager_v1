import { SSCConfig } from '../../config/ssc';
import { sscRegistry } from '../schema/ssc';

export async function scrapeSSC(log: (msg: string) => void = () => {}) {
  try {
    log('🔍 Checking update interval...');
    const lastChecked = SSCConfig.updateConfig.lastChecked
      ? new Date(SSCConfig.updateConfig.lastChecked)
      : null;

    const hoursElapsed = lastChecked
      ? (Date.now() - lastChecked.getTime()) / (1000 * 60 * 60)
      : Infinity;

    log(`⏱️ Hours since last check: ${hoursElapsed.toFixed(2)}`);

    if (hoursElapsed >= SSCConfig.updateConfig.checkIntervalHours) {
      log('🔄 Triggering update check...');
      await SSCConfig.updateConfig.checkForUpdates();
      log('✅ Update check completed.');
    }

    const requirements = SSCConfig.requirements || sscRegistry.fallback.requirements;
    log(`📦 Using ${SSCConfig.requirements ? 'live' : 'fallback'} requirements`);

    const schema = [
      {
        ...requirements.photo,
        raw: JSON.stringify(requirements.photo.additional),
      },
      {
        ...requirements.signature,
        raw: JSON.stringify(requirements.signature.additional),
      },
      {
        ...requirements.documents,
        raw: JSON.stringify(requirements.documents.required),
      },
    ];

    log(`✅ Scraped ${schema.length} requirement blocks`);
    return schema;
  } catch (err: any) {
    log(`❌ SSC scrape failed: ${err.message}`);
    return [];
  }
}