declare const __dirname: string;
declare function require(name: string): unknown;
export {};

const { readFileSync } = require('fs') as {
  readFileSync(path: string, encoding: 'utf8'): string;
};
const { join } = require('path') as {
  join(...parts: string[]): string;
};

const root = join(__dirname, '..');

describe('native release configuration', () => {
  it('keeps local aggregate releases separate from production signing', () => {
    const gradle = readFileSync(join(root, 'android/app/build.gradle'), 'utf8');
    expect(gradle).toContain('signingConfigs.localRelease');
    expect(gradle).toContain('tasks.named("assembleRelease")');
    expect(gradle).toContain('"assembleMockRelease"');
    expect(gradle).toContain('"assembleDevelopmentLiveRelease"');
    expect(gradle).toContain('"assembleStagingRelease"');
    expect(gradle).toContain('AIRMAX_ANDROID_KEYSTORE_FILE');
    expect(gradle).toContain('ProductionRelease');
    expect(gradle).toContain(
      'if (buildsProductionRelease && !releaseSigningConfigured)',
    );
  });

  it('keeps iOS local networking out of the production plist', () => {
    const production = readFileSync(
      join(root, 'ios/Airmax/Info.plist'),
      'utf8',
    );
    const development = readFileSync(
      join(root, 'ios/Airmax/Info-Debug.plist'),
      'utf8',
    );
    expect(production).not.toContain('NSAllowsLocalNetworking');
    expect(development).toContain('NSAllowsLocalNetworking');
    expect(
      readFileSync(join(root, 'ios/Config/Production.xcconfig'), 'utf8'),
    ).toContain('AIRMAX_ENV = production');
  });
});
