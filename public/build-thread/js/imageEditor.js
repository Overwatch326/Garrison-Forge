// Simple image upload + markup canvas handler.
// Keeps image + drawn overlay bundled as data URLs for now.

(function () {
  const canvas = document.getElementById('markup-canvas');
  const fileInput = document.getElementById('image-upload');
  const toggleDrawBtn = document.getElementById('toggle-draw');
  const clearBtn = document.getElementById('clear-markup');
  const colorInput = document.getElementById('brush-color');
  const sizeInput = document.getElementById('brush-size');

  if (!canvas) return; // in case script is loaded on another page

  const ctx = canvas.getContext('2d');

  let baseImageDataUrl = null; // original image
  let isDrawing = false;
  let drawingEnabled = false;
  let lastPoint = null;

  function resizeCanvasToDisplaySize() {
    const rect = canvas.getBoundingClientRect();
    const { width, height } = rect;
    if (canvas.width !== width || canvas.height !== height) {
      const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = width;
      canvas.height = height;
      ctx.putImageData(snapshot, 0, 0);
    }
  }

  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (baseImageDataUrl) {
      drawBaseImage(baseImageDataUrl);
    }
  }

  function drawBaseImage(dataUrl) {
    const img = new Image();
    img.onload = () => {
      resizeCanvasToDisplaySize();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (canvas.width - w) / 2;
      const y = (canvas.height - h) / 2;
      ctx.drawImage(img, x, y, w, h);
    };
    img.src = dataUrl;
  }

  function startDrawing(x, y) {
    if (!drawingEnabled) return;
    isDrawing = true;
    lastPoint = { x, y };
  }

  function continueDrawing(x, y) {
    if (!isDrawing || !drawingEnabled || !lastPoint) return;

    ctx.strokeStyle = colorInput.value || '#ff0000';
    ctx.lineWidth = Number(sizeInput.value) || 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastPoint = { x, y };
  }

  function stopDrawing() {
    isDrawing = false;
    lastPoint = null;
  }

  function toggleDrawingMode() {
    drawingEnabled = !drawingEnabled;
    toggleDrawBtn.textContent = drawingEnabled ? 'Drawing: ON' : 'Draw';
    toggleDrawBtn.classList.toggle('primary', drawingEnabled);
  }

  function handleFileChange(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      baseImageDataUrl = dataUrl;
      drawBaseImage(dataUrl);

      const customEvent = new CustomEvent('imageLoadedForEntry', {
        detail: { imageDataUrl: dataUrl },
      });
      window.dispatchEvent(customEvent);
    };
    reader.readAsDataURL(file);
  }

  function getSnapshot() {
    if (!baseImageDataUrl) return { base: null, merged: null };
    const mergedDataUrl = canvas.toDataURL('image/png');
    return { base: baseImageDataUrl, merged: mergedDataUrl };
  }

  function loadSnapshot({ base, merged }) {
    baseImageDataUrl = base;
    if (!base && !merged) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const toLoad = merged || base;
    const img = new Image();
    img.onload = () => {
      resizeCanvasToDisplaySize();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (canvas.width - w) / 2;
      const y = (canvas.height - h) / 2;
      ctx.drawImage(img, x, y, w, h);
    };
    img.src = toLoad;
  }

  window.ImageEditor = {
    getSnapshot,
    loadSnapshot,
    clearCanvas,
  };

  window.addEventListener('resize', resizeCanvasToDisplaySize);
  resizeCanvasToDisplaySize();

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    startDrawing(e.clientX - rect.left, e.clientY - rect.top);
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    continueDrawing(e.clientX - rect.left, e.clientY - rect.top);
  });

  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseleave', stopDrawing);

  canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    if (!touch) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    startDrawing(touch.clientX - rect.left, touch.clientY - rect.top);
  });

  canvas.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    if (!touch) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    continueDrawing(touch.clientX - rect.left, touch.clientY - rect.top);
  });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    stopDrawing();
  });

  fileInput.addEventListener('change', handleFileChange);
  toggleDrawBtn.addEventListener('click', toggleDrawingMode);
  clearBtn.addEventListener('click', () => {
    clearCanvas();
    const customEvent = new CustomEvent('canvasClearedForEntry');
    window.dispatchEvent(customEvent);
  });
})();
