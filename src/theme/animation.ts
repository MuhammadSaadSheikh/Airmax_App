export const animation = {
  duration: {
    instant: 100,
    fast: 180,
    normal: 280,
    slow: 450,
    splash: 1800,
  },
  spring: {
    responsive: { damping: 18, stiffness: 220, mass: 0.8 },
    gentle: { damping: 22, stiffness: 160, mass: 1 },
  },
  opacity: {
    pressed: 0.7,
    disabled: 0.55,
  },
} as const;
