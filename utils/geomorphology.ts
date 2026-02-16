import * as turf from '@turf/turf';
import { Feature, LineString } from 'geojson';
import { StreamParams, HydraulicMetrics, EcologicalMetrics, StreamHealth } from '../types';

/**
 * Generates a meandering path LineString feature along a multi-point valley line.
 */
export const generateMeander = (
  valleyPoints: Array<{lat: number, lng: number}>,
  amplitude: number,
  wavelength: number,
  pointsPerWave: number = 20
): Feature<LineString> => {
  if (valleyPoints.length < 2) {
    return turf.lineString([]);
  }

  // 1. Create the base Valley Line
  const coords = valleyPoints.map(p => [p.lng, p.lat]);
  const rawValleyLine = turf.lineString(coords);

  // 2. Smooth the Valley Line (Bezier Spline) to create a natural valley axis
  // We use a high resolution to ensure we can sample headings accurately
  const smoothedValley = turf.bezierSpline(rawValleyLine, {
    resolution: 10000, 
    sharpness: 0.85 
  });
  
  const valleyLength = turf.length(smoothedValley, { units: 'meters' });
  
  // 3. Generate the Meander
  const meanderPoints: number[][] = [];
  
  // Ensure wavelength is safe
  const safeWavelength = Math.max(wavelength, 10);
  const numWaves = valleyLength / safeWavelength;
  const totalSteps = Math.ceil(numWaves * pointsPerWave);
  
  // We iterate along the smoothed valley line
  for (let i = 0; i <= totalSteps; i++) {
    const fraction = i / totalSteps;
    const distanceAlongValley = fraction * valleyLength;
    
    // Get the center point on the valley axis
    // turf.along allows us to travel distance along the curve
    const centerPoint = turf.along(smoothedValley, distanceAlongValley, { units: 'meters' });
    
    // Calculate the bearing (tangent) at this specific point
    // We sample a tiny bit ahead to get the tangent
    const lookAheadDist = Math.min(distanceAlongValley + 1, valleyLength);
    const lookAheadPoint = turf.along(smoothedValley, lookAheadDist, { units: 'meters' });
    const bearing = turf.bearing(centerPoint, lookAheadPoint);
    
    // Calculate lateral offset using sine wave
    // offset = A * sin( (2*PI / wavelength) * x )
    
    // Dampening at start and end of the WHOLE line for clean connection
    const dampening = Math.sin(fraction * Math.PI); // 0 at start/end, 1 in middle
    // We dampen less aggressively (power 0.2) so the meander starts quicker
    const currentAmplitude = amplitude * Math.pow(dampening, 0.2); 
    
    const offset = currentAmplitude * Math.sin((2 * Math.PI / safeWavelength) * distanceAlongValley);
    
    // Calculate perpendicular bearing (bearing + 90 degrees)
    const offsetBearing = bearing + 90;
    
    // Find the actual meander point
    const meanderPoint = turf.destination(centerPoint, Math.abs(offset), offset > 0 ? offsetBearing : offsetBearing + 180, { units: 'meters' });
    
    meanderPoints.push(meanderPoint.geometry.coordinates);
  }
  
  return turf.lineString(meanderPoints);
};

/**
 * Calculates hydraulic parameters based on geometry and inputs.
 */
export const calculateHydraulics = (params: StreamParams, meanderGeo: Feature<LineString>): HydraulicMetrics => {
  // Calculate Valley Length from the array of points
  const coords = params.valleyLine.map(p => [p.lng, p.lat]);
  const valleyLine = turf.lineString(coords);
  
  // Length of the straight-ish segments connected
  const valleyLength = turf.length(valleyLine, { units: 'meters' });
  const channelLength = turf.length(meanderGeo, { units: 'meters' });
  
  // Sinuosity Index (SI)
  const si = valleyLength > 0 ? Math.max(1, channelLength / valleyLength) : 1;
  
  // Slopes (decimal, not percent)
  const valleySlopeDecimal = params.valleySlope / 100;
  const channelSlopeDecimal = si > 0 ? valleySlopeDecimal / si : valleySlopeDecimal;
  
  // Hydraulic Radius (R) Approximation: R = (W*D) / (W + 2D)
  const w = params.bankfullWidth;
  const d = params.bankfullDepth;
  const hydraulicRadius = (w * d) / (w + 2 * d);
  
  // Manning's Equation for Velocity: v = (1/n) * R^(2/3) * S^(1/2) (Metric)
  const calculateVelocity = (slope: number) => {
    return (1 / params.manningsN) * Math.pow(hydraulicRadius, 2 / 3) * Math.pow(slope, 0.5);
  };
  
  const vOriginal = calculateVelocity(valleySlopeDecimal); // Velocity if straight
  const vNew = calculateVelocity(channelSlopeDecimal); // Velocity if meandering
  
  // Shear Stress (Tau) = rho * g * R * S
  const rho = 1000;
  const g = 9.81;
  const shearStress = rho * g * hydraulicRadius * channelSlopeDecimal; // Pascals (N/m2)
  
  // Stream Power (Omega) = rho * g * Q * S 
  const area = w * d;
  const q = vNew * area;
  const streamPower = rho * g * q * channelSlopeDecimal; // Watts/m
  
  // Radius of Curvature (Rc) Approximation 
  // Rc = L^2 / (4 * pi^2 * A)
  const radiusOfCurvature = params.amplitude > 0 
    ? (Math.pow(params.wavelength, 2)) / (4 * Math.pow(Math.PI, 2) * params.amplitude)
    : 0;

  return {
    originalSlope: valleySlopeDecimal,
    newSlope: channelSlopeDecimal,
    sinuosityIndex: si,
    originalVelocity: vOriginal,
    newVelocity: vNew,
    shearStress,
    streamPower,
    channelLength,
    valleyLength,
    radiusOfCurvature
  };
};

export const assessEcologicalHealth = (metrics: HydraulicMetrics, params: StreamParams): { stats: EcologicalMetrics, health: StreamHealth, warnings: string[] } => {
  const warnings: string[] = [];
  
  // 1. Habitat Units (Pool-Riffle Sequence)
  const habitatSpacing = 6 * params.bankfullWidth;
  const habitatUnits = Math.floor(metrics.channelLength / habitatSpacing);
  
  // 2. Health Assessment
  let health = StreamHealth.STABLE;
  
  // Check for Avulsion Risk (Rc/W ratio)
  const rcRatio = params.bankfullWidth > 0 ? metrics.radiusOfCurvature / params.bankfullWidth : 10;
  
  if (rcRatio < 2.0 && metrics.sinuosityIndex > 1.05) {
    health = StreamHealth.HIGH_RISK;
    warnings.push(`CRITICAL: Radius of Curvature (${metrics.radiusOfCurvature.toFixed(1)}m) is too tight for width (${params.bankfullWidth}m). Ratio ${rcRatio.toFixed(1)} < 2.0.`);
  } else if (metrics.sinuosityIndex < 1.2) {
    health = StreamHealth.DEGRADED;
    warnings.push("Channel is straightened. Low habitat diversity.");
  } else if (metrics.sinuosityIndex > 1.2 && metrics.sinuosityIndex < 1.5) {
    health = StreamHealth.RECOVERING;
  }
  
  // 3. Hyporheic Potential
  let hyporheic = "Low";
  if (metrics.sinuosityIndex > 1.3) hyporheic = "Medium";
  if (metrics.sinuosityIndex > 1.5) hyporheic = "High";
  
  // 4. Sediment Transport Capacity
  const stressRatio = metrics.originalSlope > 0 
    ? metrics.shearStress / (1000 * 9.81 * ((params.bankfullWidth * params.bankfullDepth)/(params.bankfullWidth+2*params.bankfullDepth)) * metrics.originalSlope)
    : 1;

  let sediment = "Equilibrium";
  if (stressRatio < 0.6) sediment = "Aggradation (Deposition)";
  if (stressRatio > 1.2) sediment = "Degradation (Scour)";

  return {
    stats: {
      habitatUnits,
      hyporheicPotential: hyporheic,
      sedimentTransport: sediment
    },
    health,
    warnings
  };
};