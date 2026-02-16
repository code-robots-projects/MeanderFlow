import React from 'react';
import { Sliders, Activity, Droplets, Ruler, AlertTriangle } from 'lucide-react';
import { StreamParams } from '../types';

interface ControlsProps {
  params: StreamParams;
  onChange: (newParams: StreamParams) => void;
}

const Controls: React.FC<ControlsProps> = ({ params, onChange }) => {
  const handleChange = (key: keyof StreamParams, value: number) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full overflow-y-auto">
      <div className="flex items-center space-x-2 mb-6 border-b border-slate-100 pb-4">
        <Sliders className="w-5 h-5 text-cyan-600" />
        <h2 className="text-lg font-bold text-slate-800">Design Parameters</h2>
      </div>

      <div className="space-y-8">
        {/* Geometry Section */}
        <div className="space-y-4">
          <h3 className="text-sm uppercase tracking-wider text-slate-500 font-semibold flex items-center">
            <Ruler className="w-4 h-4 mr-2" /> Morphology
          </h3>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <label className="text-slate-700">Meander Amplitude (m)</label>
              <span className="font-mono text-cyan-600 font-bold">{params.amplitude}m</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              step="1"
              value={params.amplitude}
              onChange={(e) => handleChange('amplitude', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <label className="text-slate-700">Wavelength (m)</label>
              <span className="font-mono text-cyan-600 font-bold">{params.wavelength}m</span>
            </div>
            <input
              type="range"
              min="20"
              max="500"
              step="5"
              value={params.wavelength}
              onChange={(e) => handleChange('wavelength', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
            <p className="text-xs text-slate-400 mt-1">Rec: 10-14x Bankfull Width</p>
          </div>
          
           <div>
            <div className="flex justify-between text-sm mb-1">
              <label className="text-slate-700">Bankfull Width (m)</label>
              <span className="font-mono text-cyan-600 font-bold">{params.bankfullWidth}m</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              step="0.5"
              value={params.bankfullWidth}
              onChange={(e) => handleChange('bankfullWidth', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
          </div>
        </div>

        {/* Hydraulics Section */}
        <div className="space-y-4">
          <h3 className="text-sm uppercase tracking-wider text-slate-500 font-semibold flex items-center">
            <Droplets className="w-4 h-4 mr-2" /> Hydraulics
          </h3>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <label className="text-slate-700">Valley Slope (%)</label>
              <span className="font-mono text-cyan-600 font-bold">{params.valleySlope}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={params.valleySlope}
              onChange={(e) => handleChange('valleySlope', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <label className="text-slate-700">Bankfull Depth (m)</label>
              <span className="font-mono text-cyan-600 font-bold">{params.bankfullDepth}m</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={params.bankfullDepth}
              onChange={(e) => handleChange('bankfullDepth', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <label className="text-slate-700">Manning's n</label>
              <span className="font-mono text-cyan-600 font-bold">{params.manningsN}</span>
            </div>
            <input
              type="range"
              min="0.02"
              max="0.15"
              step="0.005"
              value={params.manningsN}
              onChange={(e) => handleChange('manningsN', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>Clean</span>
              <span>Gravel</span>
              <span>Vegetated</span>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-800">
           <div className="flex items-start">
             <Activity className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
             <p>Adjusting geometry immediately impacts hydraulic shear stress. Ensure <strong>Sinuosity Index (SI)</strong> > 1.2 for restoration credit.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Controls;