import React, { useRef, useState, useEffect } from 'react';
import './DrawingCanvas.css';

const DrawingCanvas = ({ value, onChange, backgroundTemplate }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    // If value changes from outside (e.g., navigating to another question and back), 
    // we could potentially draw the image back onto the canvas.
    // For simplicity, we just set up the basic drawing.
  }, [value]);

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = getCoordinates(nativeEvent);
    const context = canvasRef.current.getContext('2d');
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = getCoordinates(nativeEvent);
    const context = canvasRef.current.getContext('2d');
    context.lineTo(offsetX, offsetY);
    context.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const context = canvasRef.current.getContext('2d');
      context.closePath();
      setIsDrawing(false);
      // Save data
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onChange(dataUrl);
    }
  };

  const getCoordinates = (event) => {
    if (event.touches && event.touches.length > 0) {
      const rect = canvasRef.current.getBoundingClientRect();
      return {
        offsetX: event.touches[0].clientX - rect.left,
        offsetY: event.touches[0].clientY - rect.top
      };
    }
    return {
      offsetX: event.nativeEvent ? event.nativeEvent.offsetX : event.offsetX,
      offsetY: event.nativeEvent ? event.nativeEvent.offsetY : event.offsetY
    };
  };

  const drawBackgroundTemplate = (context, width, height) => {
    if (backgroundTemplate === 'clock') {
      context.beginPath();
      context.arc(width / 2, height / 2, 120, 0, 2 * Math.PI);
      context.lineWidth = 3;
      context.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      context.stroke();
      
      context.font = "bold 20px Inter, sans-serif";
      context.fillStyle = "rgba(255, 255, 255, 0.9)";
      context.textAlign = "center";
      context.textBaseline = "middle";
      
      for (let num = 1; num <= 12; num++) {
        let angle = num * (Math.PI / 6) - (Math.PI / 2);
        let x = width / 2 + Math.cos(angle) * 95;
        let y = height / 2 + Math.sin(angle) * 95;
        context.fillText(num.toString(), x, y);
      }
      context.beginPath();
      context.arc(width / 2, height / 2, 4, 0, 2 * Math.PI);
      context.fill(); // center dot
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#111827';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawBackgroundTemplate(context, canvas.width, canvas.height);
    onChange('');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      context.lineCap = 'round';
      context.strokeStyle = 'white'; // Matches dark mode glass theme
      context.lineWidth = 3;
      
      // Attempt to load existing value if returning to question
      if (value && value.startsWith('data:image')) {
        const img = new Image();
        img.onload = () => {
          context.fillStyle = '#111827';
          context.fillRect(0, 0, canvas.width, canvas.height);
          drawBackgroundTemplate(context, canvas.width, canvas.height);
          context.drawImage(img, 0, 0);
        };
        img.src = value;
      } else {
        context.fillStyle = '#111827';
        context.fillRect(0, 0, canvas.width, canvas.height);
        drawBackgroundTemplate(context, canvas.width, canvas.height);
      }
    }
  }, [value, backgroundTemplate]); // run once or when value initializes

  return (
    <div className="drawing-canvas-container">
      <div className="canvas-header">
        <span className="canvas-title">Drawing Area</span>
        <button className="btn-secondary canvas-clear-btn" onClick={clearCanvas}>Clear</button>
      </div>
      <canvas
        ref={canvasRef}
        width={600}
        height={300}
        className="glass-canvas"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
    </div>
  );
};

export default DrawingCanvas;
