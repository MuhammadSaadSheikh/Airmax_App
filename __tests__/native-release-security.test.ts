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
  it('does not sign Android release builds with the debug key', () => {
    const gradle = readFileSync(join(root, 'android/app/build.gradle'), 'utf8');
    const releaseBlock = gradle.match(/release \{([\s\S]*?)\n        \}/)?.[1];
    expect(releaseBlock).toBeDefined();
    expect(releaseBlock).not.toContain('signingConfigs.debug');
    expect(gradle).toContain('AIRMAX_ANDROID_KEYSTORE_FILE');
    expect(gradle).toContain('productionrelease');
  });

  it('keeps iOS local networking out of the production plist', () => {
    const production = readFileSync(join(root, 'ios/Airmax/Info.plist'), 'utf8');
    const development = readFileSync(
      join(root, 'ios/Airmax/Info-Debug.plist'),
      'utf8',
    );
    expect(production).not.toContain('NSAllowsLocalNetworking');
    expect(development).toContain('NSAllowsLocalNetworking');
    expect(readFileSync(
      join(root, 'ios/Config/Production.xcconfig'),
      'utf8',
    )).toContain('AIRMAX_ENV = production');
  });
});
