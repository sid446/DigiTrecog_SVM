'use client';

import React, { useState } from 'react';
import DigitCanvas from '@/components/DigitCanvas';
import { Brain, Cpu, Sparkles, History } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Home() {
  const [prediction, setPrediction] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [lastPixels, setLastPixels] = useState<number[] | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [history, setHistory] = useState<{ digit: number; time: string }[]>([]);

  const handlePredict = async (pixels: number[]) => {
    setIsPredicting(true);
    setLastPixels(pixels);
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pixels }),
      });

      const data = await response.json();

      if (data.prediction !== undefined) {
        setPrediction(data.prediction);
        setConfidence(data.confidence);
        
        // Add to history
        setHistory(prev => [{ digit: data.prediction, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 5));
        
        // Success flair!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#8b5cf6', '#d946ef']
        });
      } else {
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to the prediction service.');
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#020617] text-slate-50 selection:bg-blue-500/30">
      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex flex-col items-center mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
            <Brain size={16} />
            <span>SVM Powered Digit Recognition</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
            Handwritten AI
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            Draw a digit on the canvas below and watch the Support Vector Machine identify it with lightning precision.
          </p>
        </header>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Main Control Area */}
          <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
            <DigitCanvas onPredict={handlePredict} isPredicting={isPredicting} />
          </div>

          {/* Results Area */}
          <div className="lg:col-span-5 space-y-8">
            {/* Prediction Card */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-8 shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
              <Sparkles className="absolute top-4 right-4 text-white/20 group-hover:rotate-12 transition-transform duration-500" size={32} />
              <h3 className="text-white/80 font-medium mb-2 uppercase tracking-wider text-sm">Prediction Result</h3>
              <div className="flex items-baseline gap-4">
                <span className="text-8xl font-black text-white">
                  {prediction !== null ? prediction : '?'}
                </span>
                {confidence !== null && (
                  <span className="text-white/60 font-medium">
                    {(confidence * 100).toFixed(1)}% Confidence
                  </span>
                )}
              </div>
            </div>

            {/* Stats/Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-3 text-blue-400 mb-2">
                  <Cpu size={20} />
                  <span className="font-semibold text-sm">Kernel</span>
                </div>
                <p className="text-slate-300 text-lg">RBF (Radial)</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-3 text-purple-400 mb-2">
                  <History size={20} />
                  <span className="font-semibold text-sm">History</span>
                </div>
                <div className="space-y-1">
                  {history.map((h, i) => (
                    <div key={i} className="text-slate-400 text-sm flex justify-between">
                      <span>Digit {h.digit}</span>
                      <span className="text-slate-500">{h.time}</span>
                    </div>
                  ))}
                  {history.length === 0 && <p className="text-slate-500 italic text-sm">No recent data</p>}
                </div>
              </div>
            </div>

            {/* Technical Tip */}
            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                <strong className="text-slate-200">How it works:</strong> Your drawing is downsampled to an 8x8 grid. These 64 pixels are normalized and fed into an SVM classifier.
              </p>
              
              <div className="pt-4 border-t border-slate-700">
                <h4 className="text-slate-200 font-semibold mb-3 text-sm flex items-center gap-2">
                  <Sparkles size={14} className="text-yellow-500" />
                  Teach the AI
                </h4>
                <div className="flex flex-wrap gap-2 items-center">
                  <select 
                    id="correctLabel"
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {[0,1,2,3,4,5,6,7,8,9].map(n => (
                      <option key={n} value={n}>Digit {n}</option>
                    ))}
                  </select>
                  <button
                    onClick={async () => {
                      if (!lastPixels) return alert("Predict a digit first!");
                      const label = (document.getElementById('correctLabel') as HTMLSelectElement).value;
                      const res = await fetch('/api/train/save', {
                        method: 'POST',
                        body: JSON.stringify({ pixels: lastPixels, label })
                      });
                      if (res.ok) alert("Sample saved! Ready to retrain.");
                    }}
                    className="text-xs px-3 py-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-colors"
                  >
                    Save Sample
                  </button>
                  <button
                    onClick={async () => {
                      setIsTraining(true);
                      try {
                        const res = await fetch('/api/train/retrain', { method: 'POST' });
                        if (res.ok) {
                          alert("Retraining complete! Model updated.");
                          window.location.reload();
                        }
                      } finally {
                        setIsTraining(false);
                      }
                    }}
                    disabled={isTraining}
                    className="text-xs px-3 py-2 rounded-lg bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30 transition-colors disabled:opacity-50"
                  >
                    {isTraining ? 'Training...' : 'Retrain Model'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
