const {
  BackupEvidenceError,
  validateBackupEvidenceFile,
} = require('./backup-evidence');

function main(environment = process.env, argv = process.argv.slice(2)) {
  try {
    const file = argv[0] ?? environment.AIRMAX_BACKUP_EVIDENCE_FILE;
    const report = validateBackupEvidenceFile(file, environment);
    process.stdout.write(`${JSON.stringify(report)}\n`);
  } catch (error) {
    const result = {
      code:
        error instanceof BackupEvidenceError
          ? error.code
          : 'BACKUP_EVIDENCE_VALIDATION_FAILED',
      message:
        error instanceof Error
          ? error.message
          : 'Backup evidence validation failed',
      outcome: 'failed',
    };
    process.stderr.write(`${JSON.stringify(result)}\n`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { main };
