import { scrapeSSC } from './engines/ssc';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const exam = args.find((arg) => arg.startsWith('--exam'))?.split('=')[1];
const dryRun = args.includes('--dry-run');
const verbose = args.includes('--verbose');

const logPath = path.join('logs', 'scrape.log');
const log = (msg: string) => {
  if (verbose) {
    console.log(msg);
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
  }
};

if (exam === 'ssc') {
  (async () => {
    log('Starting SSC scrape...');
    console.time('scrapeSSC');

    const schema = await scrapeSSC(log);

    console.timeEnd('scrapeSSC');
    log(`Scraped ${schema.length} requirements`);

    if (dryRun) {
      console.log('🧪 Dry Run Output:\n', JSON.stringify(schema, null, 2));
      log('Dry run completed. No file written.');
      return;
    }

    fs.writeFileSync('schemas/ssc.json', JSON.stringify(schema, null, 2));
    log('✅ SSC schema written to schemas/ssc.json');
  })();
}