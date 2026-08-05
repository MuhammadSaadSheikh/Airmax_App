export * from './animation';
export * from './colors';
export * from './gradients';
export * from './layout';
export * from './radius';
export * from './shadows';
export * from './spacing';
export * from './typography';

export const money = (value: number) => `Rs. ${value.toLocaleString('en-PK')}`;
