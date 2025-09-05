import { scrapeUPSC } from './engines/upsc';
import { writeSchema } from './schema/generator';

async function main() {
  const schema = await scrapeUPSC();
  writeSchema(schema, 'upsc');
}

main();