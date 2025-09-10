import axios from 'axios';
import cheerio from 'cheerio';
import { InstitutionConfig } from './types';
import config from '@/config/institutions.json';

export async function scrapeInstitution(id: string): Promise<Record<string, string>> {
  const cfg: InstitutionConfig = config[id];
  if (!cfg) throw new Error(`Unknown institution: ${id}`);

  const res = await axios.get(cfg.url);
  const $ = cheerio.load(res.data);

  const output: Record<string, string> = {};
  for (const [key, selector] of Object.entries(cfg.selectors)) {
    output[key] = $(selector).text().trim();
  }

  return output;
}