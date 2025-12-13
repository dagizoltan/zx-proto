import { faker } from 'faker';

// Configure Faker if needed (e.g. locale)
// faker.seed(123); // Optional: for reproducibility

export { faker };

export const Random = {
  element: (arr) => arr[Math.floor(Math.random() * arr.length)],
  int: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  float: (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2)),
  bool: (chance = 0.5) => Math.random() < chance,
  date: (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())),
  uuid: () => crypto.randomUUID(),
};

export const Time = {
  now: new Date(),
  daysAgo: (n) => new Date(Date.now() - n * 86400000),
  monthsAgo: (n) => new Date(Date.now() - n * 30 * 86400000),
  addDays: (date, n) => new Date(date.getTime() + n * 86400000),
};

export const Log = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  step: (msg) => console.log(`\n🔹 ${msg}`),
  success: (msg) => console.log(`   ✅ ${msg}`),
  error: (msg, err) => console.error(`   ❌ ${msg}`, err || ''),
  progress: (current, total) => {
    if (current % Math.ceil(total / 20) === 0 || current === total) {
      const pct = Math.round((current / total) * 100);
      const bars = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
      const msg = `\r   [${bars}] ${pct}% (${current}/${total})`;
      Deno.stdout.write(new TextEncoder().encode(msg));
    }
    if (current === total) Deno.stdout.write(new TextEncoder().encode('\n'));
  }
};
