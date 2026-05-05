'use client';

import React, { useRef, useEffect, useState } from 'react';

interface DigitCanvasProps {
  onPredict: (pixels: number[]) => void;
  isPredicting: boolean;
}

const DigitCanvas: React.FC<DigitCanvasProps> = ({ onPredict, isPredicting }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set initial canvas state
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 24; // Increased thickness
    ctx.strokeStyle = 'white';
    ctx.shadowBlur = 8; // Soften the edges for better downsampling
    ctx.shadowColor = 'white';
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath(); // Reset path
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handlePredict = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Find the bounding box of the drawing
    const mainCtx = canvas.getContext('2d');
    if (!mainCtx) return;
    const mainData = mainCtx.getImageData(0, 0, canvas.width, canvas.height);
    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
    let found = false;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const alpha = mainData.data[(y * canvas.width + x) * 4 + 3];
        const r = mainData.data[(y * canvas.width + x) * 4]; // Check R channel since background is black (0) and brush is white (255)
        if (r > 20) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
          found = true;
        }
      }
    }

    if (!found) {
      alert("Please draw something first!");
      return;
    }

    // Add padding to the bounding box
    const padding = 20;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(canvas.width, maxX + padding);
    maxY = Math.min(canvas.height, maxY + padding);

    const width = maxX - minX;
    const height = maxY - minY;
    const size = Math.max(width, height); // Square crop

    // 2. Create a temporary 8x8 canvas to downsample
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 8;
    tempCanvas.height = 8;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Center the crop in a square before downsampling
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = size;
    cropCanvas.height = size;
    const cropCtx = cropCanvas.getContext('2d');
    if (cropCtx) {
      cropCtx.fillStyle = 'black';
      cropCtx.fillRect(0, 0, size, size);
      // Center the actual drawing in the square crop canvas
      const offsetX = (size - width) / 2;
      const offsetY = (size - height) / 2;
      cropCtx.drawImage(canvas, minX, minY, width, height, offsetX, offsetY, width, height);
      
      // Now downsample from the centered crop to 8x8
      tempCtx.drawImage(cropCanvas, 0, 0, 8, 8);
    } else {
      tempCtx.drawImage(canvas, minX, minY, width, height, 0, 0, 8, 8);
    }

    // 3. Get the pixel data from the 8x8 canvas
    const imageData = tempCtx.getImageData(0, 0, 8, 8);
    const pixels = [];

    // The dataset expects values in 0-1 range (our model was trained on 0-1 normalized pixels)
    // Grayscale: (R+G+B)/3 or just use one channel since it's B/W
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const avg = (r + g + b) / 3;
      // Normalize to 0-1
      pixels.push(avg / 255.0);
    }

    console.log('Processed 8x8 Pixels:', pixels);
    onPredict(pixels);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
        <canvas
          ref={canvasRef}
          width={280}
          height={280}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="relative bg-black rounded-lg cursor-crosshair touch-none border-2 border-slate-800"
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={clearCanvas}
          className="px-6 py-2 rounded-full border border-slate-700 hover:bg-slate-800 transition-colors text-slate-300 font-medium"
        >
          Clear
        </button>
        <button
          onClick={handlePredict}
          disabled={isPredicting}
          className={`px-8 py-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold transition-all shadow-lg hover:shadow-blue-500/25 ${
            isPredicting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isPredicting ? 'Analyzing...' : 'Recognize Digit'}
        </button>
      </div>
    </div>
  );
};

export default DigitCanvas;
