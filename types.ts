export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface StreamParams {
  valleySlope: number; // Percentage (0-100)
  bankfullWidth: number; // meters
  bankfullDepth: number; // meters
  manningsN: number; // roughness coefficient
  sinuosityTarget: number; // Target SI
  wavelength: number; // meters
  amplitude: number; // meters
  valleyLine: GeoPoint[]; // Ordered list of points defining the valley axis
}

export interface HydraulicMetrics {
  originalSlope: number;
  newSlope: number;
  sinuosityIndex: number;
  originalVelocity: number;
  newVelocity: number;
  shearStress: number;
  streamPower: number;
  channelLength: number;
  valleyLength: number;
  radiusOfCurvature: number;
}

export interface EcologicalMetrics {
  habitatUnits: number; // Estimated pools/riffles
  hyporheicPotential: string; // Low, Medium, High
  sedimentTransport: string; // Aggradation, Equilibrium, Degradation
}

export enum StreamHealth {
  DEGRADED = 'Degraded',
  RECOVERING = 'Recovering',
  STABLE = 'Stable',
  HIGH_RISK = 'High Risk (Avulsion)',
}