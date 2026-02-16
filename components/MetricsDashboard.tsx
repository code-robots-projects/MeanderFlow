import React from 'react';
import { HydraulicMetrics, EcologicalMetrics, StreamHealth } from '../types';
import { TrendingUp, TrendingDown, AlertTriangle, Fish, Wind, Waves } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface MetricsDashboardProps {
  metrics: HydraulicMetrics;
  eco: { stats: EcologicalMetrics, health: StreamHealth, warnings: string[] };
}

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ metrics, eco }) => {
  
  const healthColor = {
    [StreamHealth.DEGRADED]: 'text-red-600 bg-red-50 border-red-200',
    [StreamHealth.RECOVERING]: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    [StreamHealth.STABLE]: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    [StreamHealth.HIGH_RISK]: 'text-orange-700 bg-orange-100 border-orange-300',
  }[eco.health];

  const chartData = [
    { name: 'Velocity (m/s)', original: metrics.originalVelocity, new: metrics.newVelocity },
    { name: 'Slope (%)', original: metrics.originalSlope * 100, new: metrics.newSlope * 100 },
  ];

  return (
    <div className="space-y-6">
      
      {/* Health Status Banner */}
      <div className={`p-4 rounded-lg border flex items-start ${healthColor}`}>
        <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wide">Stream Health: {eco.health}</h3>
          {eco.warnings.length > 0 && (
            <ul className="mt-2 text-sm list-disc pl-4 space-y-1 opacity-90">
              {eco.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          )}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500 uppercase font-semibold">Sinuosity Index</p>
          <div className="flex items-end mt-1">
            <span className="text-2xl font-bold text-slate-800">{metrics.sinuosityIndex.toFixed(2)}</span>
            <span className="text-xs ml-2 mb-1 text-slate-400">Target: &gt;1.5</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500 uppercase font-semibold">Shear Stress</p>
          <div className="flex items-end mt-1">
            <span className="text-2xl font-bold text-slate-800">{metrics.shearStress.toFixed(1)}</span>
            <span className="text-xs ml-1 mb-1 text-slate-400">Pa</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500 uppercase font-semibold">Stream Power</p>
          <div className="flex items-end mt-1">
            <span className="text-2xl font-bold text-slate-800">{metrics.streamPower.toFixed(0)}</span>
            <span className="text-xs ml-1 mb-1 text-slate-400">W/m</span>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500 uppercase font-semibold">Habitat Units</p>
          <div className="flex items-end mt-1">
            <span className="text-2xl font-bold text-emerald-600">+{eco.stats.habitatUnits}</span>
            <span className="text-xs ml-1 mb-1 text-slate-400">pools</span>
          </div>
        </div>
      </div>

      {/* Comparisons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-md font-bold text-slate-800 mb-4 flex items-center">
             <TrendingDown className="w-4 h-4 mr-2 text-cyan-600" />Slope & Velocity Reduction
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} style={{ fontSize: '12px' }} />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="original" name="Degraded (Straight)" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                <Bar dataKey="new" name="Restored (Meander)" fill="#0891b2" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-500 mt-2 italic">
            Increasing channel length reduces effective slope, thereby reducing velocity and erosive forces.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-md font-bold text-slate-800 mb-4 flex items-center">
            <Fish className="w-4 h-4 mr-2 text-emerald-600" />Ecological Uplift
          </h3>
          
          <div className="space-y-4">
             <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <span className="text-sm text-slate-600">Added Length</span>
                <span className="font-mono font-bold text-cyan-700">
                  +{(metrics.channelLength - metrics.valleyLength).toFixed(1)} m
                </span>
             </div>
             
             <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <span className="text-sm text-slate-600">Hyporheic Exchange</span>
                <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                  eco.stats.hyporheicPotential === 'High' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {eco.stats.hyporheicPotential}
                </span>
             </div>

             <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <span className="text-sm text-slate-600">Sediment Regime</span>
                <span className="text-sm font-medium text-slate-800 text-right">
                  {eco.stats.sedimentTransport}
                </span>
             </div>

             <div className="mt-4 bg-slate-50 p-3 rounded text-xs text-slate-500 leading-relaxed">
               <strong>Thalweg Dynamics:</strong> The generated meander introduces point bars (deposition) and cut banks (scour), essential for macroinvertebrate diversity.
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsDashboard;