const {
  DeploymentSafetyError,
  loadDeploymentConfig,
  runPreflight,
  runSafeDeploy,
  runVerify,
  sanitizeText,
} = require('./deployment-safety');
const {
  createDatabaseAdapter,
  createProcessAdapter,
  writeDeploymentReport,
} = require('./adapters');

async function main(phase, environment = process.env) {
  let config;
  let database;
  let report;
  try {
    config = loadDeploymentConfig(environment, {
      requireApprovals: phase !== 'verify',
    });
    database = createDatabaseAdapter(config.databaseUrl);
    const options = {
      database,
      environment,
      processAdapter: createProcessAdapter(environment),
    };
    if (phase === 'preflight') report = await runPreflight(options);
    else if (phase === 'safe-deploy') report = await runSafeDeploy(options);
    else if (phase === 'verify') report = await runVerify(options);
    else throw new Error(`Unsupported deployment phase: ${phase}`);

    const reportFile = writeDeploymentReport(report, config.reportDir);
    process.stdout.write(
      `${JSON.stringify({
        outcome: report.outcome,
        phase: report.phase,
        reportFile,
        target: report.target,
      })}\n`,
    );
  } catch (error) {
    const code =
      error instanceof DeploymentSafetyError
        ? error.code
        : 'DEPLOYMENT_SAFETY_ERROR';
    const message = sanitizeText(
      error instanceof Error ? error.message : String(error),
      config?.databaseUrl ?? environment.DATABASE_URL,
    );
    const failedReport = {
      code,
      message,
      outcome: 'failed',
      phase,
      releaseSha: config?.releaseSha,
      target: config?.target,
    };
    try {
      const reportFile = writeDeploymentReport(
        failedReport,
        config?.reportDir ??
          require('node:path').resolve(
            __dirname,
            '../../artifacts/database-deployment',
          ),
      );
      failedReport.reportFile = reportFile;
    } catch {
      // Reporting must not replace the original fail-closed deployment error.
    }
    process.stderr.write(`${JSON.stringify(failedReport)}\n`);
    process.exitCode = 1;
  } finally {
    await database?.close();
  }
}

module.exports = { main };
