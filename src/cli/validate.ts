import fs from 'fs';
import path from 'path';
import { validateFile } from '@/features/validate/validate';
import { ExamSchema } from '@/features/exam/examSchema';
import { config } from '@/config/validationConfig';

const schemaPath = path.resolve(process.cwd(), 'src/schemas/ssc.json');
const schema: ExamSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8')).versions[0];

const filesDir = path.resolve(process.cwd(), 'uploads');
const files = fs.readdirSync(filesDir);

const rollNumber = process.argv[2] || 'CLI_USER';

files.forEach((fileName) => {
  const filePath = path.join(filesDir, fileName);
  const fileBuffer = fs.readFileSync(filePath);
  const file = new File([fileBuffer], fileName);

  const errors = validateFile(file, schema, rollNumber);

  console.log(`\n📄 ${fileName}`);
  if (errors.length === 0) {
    console.log('✅ Valid');
  } else {
    errors.forEach((err) => console.log(`❌ ${err.type}: ${err.message}`));
  }
});