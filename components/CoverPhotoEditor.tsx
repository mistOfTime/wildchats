'use client';

import { useState, useRef, useEffect } from 'react';

interface CoverPhotoEditorProps {
  imageUrl: string;
  onSave: (croppedImage: Blob) => void;
  onCancel: () => void;
}

export default function CoverPhotoEditor({ imageUrl, onSave, onCancel }: CoverPhotoEditorProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      
      // Center image initially
      const canvas = canvasRef.current;
      if (canvas) {
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const imgAspect = img.width / img.height;
        const canvasAspect = canvasWidth / canvasHeight;
        
        let imgWidth, imgHeight;
        if (imgAspect > canvasAspect) {
          imgWidth = canvasWidth;
          imgHeight = canvasWidth / imgAspect;
        } else {
          imgHeight = canvasHeight;
          imgWidth = canvasHeight * imgAspect;
        }
        
        setPosition({
          x: (canvasWidth - imgWidth) / 2,
          y: (canvasHeight - imgHeight) / 2
        });
      }
      
      drawImage();
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    drawImage();
  }, [scale, position]);

  const drawImage = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate dimensions to fit image while maintaining aspect ratio
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imgAspect = img.width / img.height;
    const canvasAspect = canvasWidth / canvasHeight;
    
    let imgWidth = img.width * scale;
    let imgHeight = img.height * scale;
    
    // Scale image to fit canvas initially
    if (scale === 1) {
      if (imgAspect > canvasAspect) {
        // Image is wider
        imgWidth = canvasWidth;
        imgHeight = canvasWidth / imgAspect;
      } else {
        // Image is taller
        imgHeight = canvasHeight;
        imgWidth = canvasHeight * imgAspect;
      }
    }

    // Draw image
    ctx.drawImage(
      img,
      position.x,
      position.y,
      imgWidth,
      imgHeight
    );
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        onSave(blob);
      }
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-red-800 to-yellow-600">
          <h2 className="text-xl font-bold text-white">Adjust Cover Photo</h2>
          <p className="text-sm text-yellow-100 mt-1">Drag to reposition, use slider to zoom</p>
        </div>

        {/* Canvas Container */}
        <div className="p-6 bg-gray-100 dark:bg-gray-900">
          <div
            ref={containerRef}
            className="relative w-full bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden"
            style={{ height: '300px' }}
          >
            <canvas
              ref={canvasRef}
              width={800}
              height={300}
              className="w-full h-full cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          </div>

          {/* Zoom Control */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Zoom: {Math.round(scale * 100)}%
            </label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-600"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-800 to-yellow-600 text-white rounded-xl font-semibold hover:from-red-900 hover:to-yellow-700 transition shadow-lg"
          >
            Save Cover Photo
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
