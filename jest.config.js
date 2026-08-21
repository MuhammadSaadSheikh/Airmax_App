module.exports = {
  preset: '@react-native/jest-preset',
  watchman: false,
  roots: ['<rootDir>/__tests__'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
};
