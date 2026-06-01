import React, { useRef, useState, useEffect, useCallback } from 'react';

const COLORS = ['#000000','#ffffff','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#14b8a6'];
const MAX_HISTORY = 20;

export default function DrawingApp() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  const [tool, setTool] = useState('pen');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const lastPos = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const saved = localStorage.getItem('drawing-app-canvas');
    if (saved) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = saved;
    }
    saveToHistory();
  }, []);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL();
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(dataURL);
      if (newHistory.length > MAX_HISTORY) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
    localStorage.setItem('drawing-app-canvas', dataURL);
  }, [historyIndex]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e) => {
    const pos = getPos(e, canvasRef.current);
    lastPos.current = pos;
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === 'eraser' ? '#1a1a2e' : color;
    ctx.lineWidth = tool === 'eraser' ? brushSize * 3 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDrawing = () => {
    if (isDrawing) { setIsDrawing(false); saveToHistory(); }
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = history[newIndex];
    setHistoryIndex(newIndex);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = history[newIndex];
    setHistoryIndex(newIndex);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    localStorage.removeItem('drawing-app-canvas');
    saveToHistory();
  };

  const downloadPNG = () => {
    const link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#0f0f1a', color:'#fff', fontFamily:'sans-serif' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', background:'#1a1a2e', borderBottom:'1px solid #333', flexWrap:'wrap' }}>
        <span style={{ fontWeight:'bold', fontSize:18 }}>🎨 DrawingApp</span>
        <div style={{ display:'flex', gap:6 }}>
          {COLORS.map(c => (
            <div key={c} onClick={() => { setColor(c); setTool('pen'); }}
              style={{ width:24, height:24, borderRadius:'50%', background:c, border: color===c && tool==='pen' ? '3px solid #60a5fa':'2px solid #444', cursor:'pointer' }} />
          ))}
          <input type="color" value={color} onChange={e => { setColor(e.target.value); setTool('pen'); }}
            style={{ width:24, height:24, border:'none', borderRadius:'50%', cursor:'pointer' }} />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:13 }}>Size: {brushSize}</span>
          <input type="range" min="1" max="40" value={brushSize} onChange={e => setBrushSize(+e.target.value)} style={{ width:80 }} />
        </div>
        {[['pen','✏️ Pen'],['eraser','⬜ Eraser']].map(([t,label]) => (
          <button key={t} onClick={() => setTool(t)}
            style={{ padding:'4px 12px', borderRadius:8, border:'none', background: tool===t?'#3b82f6':'#2d2d4e', color:'#fff', cursor:'pointer' }}>{label}</button>
        ))}
        <button onClick={undo} style={{ padding:'4px 12px', borderRadius:8, border:'none', background:'#2d2d4e', color:'#fff', cursor:'pointer' }}>↩ Undo</button>
        <button onClick={redo} style={{ padding:'4px 12px', borderRadius:8, border:'none', background:'#2d2d4e', color:'#fff', cursor:'pointer' }}>↪ Redo</button>
        <button onClick={clearCanvas} style={{ padding:'4px 12px', borderRadius:8, border:'none', background:'#ef4444', color:'#fff', cursor:'pointer' }}>🗑 Clear</button>
        <button onClick={downloadPNG} style={{ padding:'4px 12px', borderRadius:8, border:'none', background:'#22c55e', color:'#fff', cursor:'pointer' }}>⬇ PNG</button>
      </div>
      <canvas ref={canvasRef} style={{ flex:1, width:'100%', cursor: tool==='eraser'?'cell':'crosshair', touchAction:'none' }}
        onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
        onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
    </div>
  );
}