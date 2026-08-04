import { spawn } from 'node:child_process';

const child = spawn('npx ng test --watch=false --coverage', {
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe']
});

let output = '';

const onData = (chunk) => {
  const text = chunk.toString();
  output += text;
  process.stdout.write(text);
};

const onErrorData = (chunk) => {
  const text = chunk.toString();
  output += text;
  process.stderr.write(text);
};

child.stdout.on('data', onData);
child.stderr.on('data', onErrorData);

child.on('close', (code) => {
  if (code !== 0) {
    process.exit(code ?? 1);
  }

  const metrics = ['Statements', 'Branches', 'Functions', 'Lines'];
  const failures = [];

  for (const metric of metrics) {
    const match = output.match(new RegExp(`${metric}\\s*:\\s*([0-9.]+)%`));
    if (!match) {
      failures.push(`No se encontro metrica de coverage para ${metric}.`);
      continue;
    }

    const value = Number(match[1]);
    if (value !== 100) {
      failures.push(`${metric} debe ser 100% y fue ${value}%.`);
    }
  }

  if (failures.length > 0) {
    process.stderr.write('\nCoverage gate failed:\n');
    for (const failure of failures) {
      process.stderr.write(`- ${failure}\n`);
    }
    process.exit(1);
  }

  process.stdout.write('\nCoverage gate passed: 100% en todas las metricas.\n');
});
