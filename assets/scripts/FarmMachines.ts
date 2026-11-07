export interface MachinePose {
  spin: number;
  arm: number;
  bob: number;
  running: boolean;
  working: boolean;
}

export function machinePose(time: number, enabled: boolean, working: boolean): MachinePose {
  const speed = !enabled ? 0 : working ? 2.4 : 0.8;
  return {
    spin: time * speed,
    arm: enabled ? Math.sin(time * (working ? 7 : 2.2)) : 0,
    bob: enabled ? Math.abs(Math.sin(time * (working ? 9 : 3))) * (working ? 5 : 2) : 0,
    running: enabled,
    working: enabled && working,
  };
}
