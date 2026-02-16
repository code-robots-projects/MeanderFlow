import React, { useState, useMemo } from 'react';
import { Layers, Map as MapIcon, Info, Share2, MousePointerClick } from 'lucide-react';
import Controls from './components/Controls';
import StreamMap from './components/StreamMap';
import MetricsDashboard from './components/MetricsDashboard';
import { generateMeander, calculateHydraulics, assessEcologicalHealth } from './utils/geomorphology';
import { StreamParams, GeoPoint } from './types';

// Initial Configuration
const INITIAL_PARAMS: StreamParams = {
  valleySlope: 2.5,
  bankfullWidth: 8,
  bankfullDepth: 1.2,
  manningsN: 0.045, // Clean, winding, some pools/shoals
  sinuosityTarget: 1.0,
  wavelength: 100,
  amplitude: 20,
  // Nottingham Road, KwaZulu-Natal coordinates (Sequence of points)
  valleyLine: [
    { lat: -29.356, lng: 29.997 },
    { lat: -29.354, lng: 30.001 },
    { lat: -29.352, lng: 30.005 }
  ]
};

function App() {
  const [params, setParams] = useState<StreamParams>(INITIAL_PARAMS);
  const [activeTab, setActiveTab] = useState<'design' | 'impact'>('design');

  // Memoize heavy calculations
  const meanderGeo = useMemo(() => {
    return generateMeander(
      params.valleyLine,
      params.amplitude,
      params.wavelength
    );
  }, [params.valleyLine, params.amplitude, params.wavelength]);

  const metrics = useMemo(() => {
    return calculateHydraulics(params, meanderGeo);
  }, [params, meanderGeo]);

  const ecoHealth = useMemo(() => {
    return assessEcologicalHealth(metrics, params);
  }, [metrics, params]);

  // Update a specific point in the line
  const handlePointMove = (index: number, point: GeoPoint) => {
    const newLine = [...params.valleyLine];
    newLine[index] = point;
    setParams(prev => ({ ...prev, valleyLine: newLine }));
  };

  // Add a new point to the end of the line
  const handlePointAdd = (point: GeoPoint) => {
    setParams(prev => ({ 
      ...prev, 
      valleyLine: [...prev.valleyLine, point] 
    }));
  };

  // Remove a point (if we have at least 2 remaining)
  const handlePointDelete = (index: number) => {
    if (params.valleyLine.length <= 2) return;
    const newLine = params.valleyLine.filter((_, i) => i !== index);
    setParams(prev => ({ ...prev, valleyLine: newLine }));
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm z-20">
        <div className="flex items-center space-x-3">
          <div className="bg-cyan-600 p-2 rounded-lg">
             <Layers className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">MeanderFlow</h1>
            <p className="text-xs text-slate-500 font-medium">Stream Restoration Design Tool</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex text-xs text-slate-400 space-x-4 mr-4 border-r border-slate-200 pr-4">
             <span>v = 1/n R⅔ S½</span>
             <span>τ = γRS</span>
          </div>
          <button className="flex items-center space-x-2 text-sm font-medium text-slate-600 hover:text-cyan-600 transition-colors">
            <Info className="w-4 h-4" />
            <span>Guide</span>
          </button>
           <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center">
            <Share2 className="w-4 h-4 mr-2" /> Export Report
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar (Controls) */}
        <aside className="w-80 md:w-96 flex-shrink-0 p-4 overflow-hidden flex flex-col h-full border-r border-slate-200 bg-slate-50/50 z-10">
          <Controls params={params} onChange={setParams} />
        </aside>

        {/* Center/Right Content */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {/* Tabs / Overlay Toggle for Mobile (Simplified here) */}
          <div className="absolute top-4 left-4 z-[400] flex bg-white/90 backdrop-blur shadow-sm rounded-lg p-1 border border-slate-200">
             <button 
               onClick={() => setActiveTab('design')}
               className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'design' ? 'bg-cyan-100 text-cyan-800 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
             >
               Map View
             </button>
             <button 
               onClick={() => setActiveTab('impact')}
               className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'impact' ? 'bg-emerald-100 text-emerald-800 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
             >
               Impact Dashboard
             </button>
          </div>
          
          {/* Instructions Overlay */}
          <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur rounded-lg shadow-sm border border-slate-200 px-4 py-2 text-xs text-slate-600 flex items-center space-x-2">
            <MousePointerClick className="w-4 h-4 text-cyan-600" />
            <span>Click map to add points. Drag to move. Right-click to delete.</span>
          </div>

          <div className="flex-1 relative">
             {/* Map Layer - Always render but hide if tab is impact to preserve context or just layer on top */}
             <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'design' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                <div className="w-full h-full p-4">
                  <StreamMap 
                    params={params} 
                    meanderGeo={meanderGeo} 
                    onPointMove={handlePointMove}
                    onPointAdd={handlePointAdd}
                    onPointDelete={handlePointDelete}
                  />
                </div>
             </div>

             {/* Dashboard Layer */}
             <div className={`absolute inset-0 bg-slate-50 p-6 overflow-y-auto transition-opacity duration-300 ${activeTab === 'impact' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                 <div className="max-w-5xl mx-auto pt-12">
                   <div className="mb-6">
                     <h2 className="text-2xl font-bold text-slate-800">Restoration Impact Analysis</h2>
                     <p className="text-slate-500">Projected geomorphic and ecological responses based on current geometry.</p>
                   </div>
                   <MetricsDashboard metrics={metrics} eco={ecoHealth} />
                 </div>
             </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;