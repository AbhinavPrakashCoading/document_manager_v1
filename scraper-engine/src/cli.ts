import { scrapeSSC } from './engines/ssc';

if (exam === 'ssc') {
  const schema = await scrapeSSC();
  fs.writeFileSync('schemas/ssc.json', JSON.stringify(schema, null, 2));
}
