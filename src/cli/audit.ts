import fs from 'fs';
import path from 'path';

const logPath = path.resolve(process.cwd(), 'logs/audit.json');

if (!fs.existsSync(logPath)) {
  console.log('❌ No audit log found.');
  process.exit(1);
}

const entries = JSON.parse(fs.readFileSync(logPath, 'utf-8'));

console.log(`\n🧾 Audit Log Summary (${entries.length} entries)\n`);

entries.forEach((entry: any, idx: number) => {
  console.log(`${idx + 1}. 📄 ${entry.file}`);
  console.log(`   🔢 Roll No: ${entry.rollNumber}`);
  console.log(`   🕒 Time: ${entry.timestamp}`);
  console.log(`   🧠 Mode: ${entry.mode}`);
  console.log(`   ✅ Result: ${entry.result}`);
  if (entry.errors?.length) {
    console.log(`   ❌ Errors:`);
    entry.errors.forEach((err: any) => {
      console.log(`     - ${err.type}: ${err.message}`);
    });
  }
  console.log('');
});