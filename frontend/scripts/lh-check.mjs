import { execSync } from 'node:child_process';

const url = process.env.LH_URL || 'http://localhost:3000';
const cmd = `npx lighthouse ${url} --quiet --chrome-flags="--headless" --only-categories=performance,accessibility --output=json --output-path=stdout`;
const out = execSync(cmd, { stdio: 'pipe' }).toString();
const report = JSON.parse(out);

function score(cat) { return Math.round((report.categories[cat].score || 0) * 100); }

const perf = score('performance');
const a11y = score('accessibility');

console.log(`Lighthouse: performance=${perf}, accessibility=${a11y}`);
if (perf < 85 || a11y < 90) {
  console.error('Lighthouse thresholds not met.');
  process.exit(1);
}
