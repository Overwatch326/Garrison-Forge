import { useEffect, useRef, useState } from 'react';

interface Props {
  imageDataUrl: string;
  initialAnnotatedDataUrl?: string;
  onSave: (annotatedDataUrl: string) => void;
  onCancel: () => void;
}

interface Point {
  x: number;
  y: number;
}

type Tool = 'brush' | 'box' | 'arrow';

export function PhotoAnnotator({ imageDataUrl, initialAnnotatedDataUrl, onSave, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [brushColor, setBrushColor] = useState<string>('#f97373');
  const [brushSize, setBrushSize] = useState<number>(3);
  const [tool, setTool] = useState<Tool>('brush');

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fit canvas to image while keeping aspect ratio, but cap size for UI.
      const maxWidth = 800;
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (initialAnnotatedDataUrl) {
        const overlay = new Image();
        overlay.onload = () => {
          ctx.drawImage(overlay, 0, 0, canvas.width, canvas.height);
        };
        overlay.src = initialAnnotatedDataUrl;
      }
    };
    img.src = imageDataUrl;
  }, [imageDataUrl, initialAnnotatedDataUrl]);

  function getCanvasPoint(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>): Point | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    const point = getCanvasPoint(e);
    if (!point) return;
    setIsDrawing(true);
    setLastPoint(point);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if (!isDrawing || !lastPoint) return;
    if (tool !== 'brush') return; // box/arrow draw on mouse up only

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const point = getCanvasPoint(e);
    if (!point) return;

    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    setLastPoint(point);
  }

  function drawBox(from: Point, to: Point) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    const x = Math.min(from.x, to.x);
    const y = Math.min(from.y, to.y);
    const w = Math.abs(from.x - to.x);
    const h = Math.abs(from.y - to.y);
    ctx.strokeRect(x, y, w, h);
  }

  function drawArrow(from: Point, to: Point) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';

    // main line
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    // arrow head
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const headLength = 8 + brushSize; // a bit bigger for thicker brushes
    const arrowAngles = [Math.PI / 7, -Math.PI / 7];
    arrowAngles.forEach((a) => {
      const x = to.x - headLength * Math.cos(angle + a);
      const y = to.y - headLength * Math.sin(angle + a);
      ctx.beginPath();
      ctx.moveTo(to.x, to.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    });
  }

  function handleMouseUp(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if (isDrawing && lastPoint && tool !== 'brush') {
      const point = getCanvasPoint(e);
      if (point) {
        if (tool === 'box') {
          drawBox(lastPoint, point);
        } else if (tool === 'arrow') {
          drawArrow(lastPoint, point);
        }
      }
    }

    setIsDrawing(false);
    setLastPoint(null);
  }

  function handleClear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = imageRef.current;
    if (!img) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }

  function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <div className="w-full max-w-4xl card-surface p-4 sm:p-6 relative max-h-[95vh] overflow-y-auto">
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-3 top-3 text-slate-400 hover:text-slate-100 text-xs"
        >
          Close
        </button>

        <h3 className="text-sm font-semibold text-slate-100 mb-3">Annotate Photo</h3>

        {/* Hidden base image, used only when clearing */}
        <img
          ref={imageRef}
          src={imageDataUrl}
          alt="Base"
          className="hidden"
        />

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-3 items-center text-[11px] text-slate-200 mb-2">
            <div className="flex items-center gap-1 border border-slate-700 rounded px-1.5 py-0.5 bg-slate-900/60">
              <span className="text-slate-400 mr-1">Tool</span>
              <button
                type="button"
                className={`px-2 py-0.5 rounded text-[10px] border ${
                  tool === 'brush'
                    ? 'border-imperial-red bg-imperial-red/30 text-slate-50'
                    : 'border-transparent text-slate-300 hover:text-slate-50'
                }`}
                onClick={() => setTool('brush')}
              >
                Brush
              </button>
              <button
                type="button"
                className={`px-2 py-0.5 rounded text-[10px] border ${
                  tool === 'box'
                    ? 'border-imperial-red bg-imperial-red/30 text-slate-50'
                    : 'border-transparent text-slate-300 hover:text-slate-50'
                }`}
                onClick={() => setTool('box')}
              >
                Box
              </button>
              <button
                type="button"
                className={`px-2 py-0.5 rounded text-[10px] border ${
                  tool === 'arrow'
                    ? 'border-imperial-red bg-imperial-red/30 text-slate-50'
                    : 'border-transparent text-slate-300 hover:text-slate-50'
                }`}
                onClick={() => setTool('arrow')}
              >
                Arrow
              </button>
            </div>

            <label className="flex items-center gap-1">
              <span className="text-slate-400">Color</span>
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-8 h-6 bg-transparent border border-slate-600 rounded"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-slate-400">Size</span>
              <input
                type="range"
                min={1}
                max={12}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
              />
              <span className="text-slate-300 w-6">{brushSize}</span>
            </label>
            <button
              type="button"
              onClick={handleClear}
              className="btn-secondary px-3 py-1 text-[11px]"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn-primary px-3 py-1 text-[11px]"
            >
              Save Annotation
            </button>
          </div>

          <div className="border border-slate-800 rounded-md bg-black/60 flex justify-center items-center overflow-auto max-h-[70vh]">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="max-w-full h-auto cursor-crosshair bg-black"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
