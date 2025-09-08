import { scrapeSSC } from './engines/ssc';
import fs from 'fs';

const args = process.argv.slice(2);
const exam = args.find((arg) => arg.startsWith('--exam'))?.split('=')[1];

if (exam === 'ssc') {
  (async () => {
    const schema = await scrapeSSC();
    fs.writeFileSync('schemas/ssc.json', JSON.stringify(schema, null, 2));
    console.log('✅ SSC schema written to schemas/ssc.json');
  })();
}