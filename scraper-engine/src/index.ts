import { scrapeUPSC } from './engines/upsc';
import { writeSchema } from './schema/generator';

const args = process.argv.slice(2);
const examId = args[0];

async function main() {
  if (!examId) {
    console.error('❌ Please provide an exam ID');
    process.exit(1);
  }

  if (examId === 'upsc') {
    const schema = await scrapeUPSC();
    writeSchema(schema, examId);
  } else {
    console.error(`❌ No engine found for exam: ${examId}`);
    process.exit(1);
  }
}

main();
