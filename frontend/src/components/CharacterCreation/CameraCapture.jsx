import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, X, AlertCircle, Loader } from 'lucide-react';

export default function CameraCapture({ onCharacterDataExtracted, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const inputRef = useRef(null);
  
  const [showVideo, setShowVideo] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const startCamera = async () => {
    try {
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          facingMode: 'environment'
        },
        audio: false
      });
      
      if (!videoRef.current) {
        setShowVideo(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.error('Error al reproducir:', e));
          }
        }, 100);
        return;
      }
      
      videoRef.current.srcObject = stream;
      setShowVideo(true);
      
      setTimeout(() => {
        videoRef.current?.play().catch(e => console.error('Error al reproducir:', e));
      }, 500);
      
    } catch (err) {
      console.error('Error de cámara:', err);
      let msg = 'Error al acceder a la cámara';
      if (err.name === 'NotAllowedError') msg = 'Permiso denegado. Permite el acceso en el navegador.';
      else if (err.name === 'NotFoundError') msg = 'No hay cámara disponible.';
      else if (err.name === 'NotReadableError') msg = 'La cámara no responde.';
      else msg = err.message;
      setError(msg);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setShowVideo(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      
      let width = videoRef.current.videoWidth;
      let height = videoRef.current.videoHeight;
      
      const MAX_DIM = 1600;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }
      
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      context.drawImage(videoRef.current, 0, 0, width, height);
      
      const imageData = canvasRef.current.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
      stopCamera();
    }
  };

  const processImage = async (imageData) => {
    setLoading(true);
    setError(null);

    try {
      const blob = await (await fetch(imageData)).blob();
      const formData = new FormData();
      formData.append('file', blob, 'character.jpg');

      const token = localStorage.getItem('token');
      const response = await fetch('/api/vision/digitize', {
        method: 'POST',
        body: formData,
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      const result = await response.json();

      if (result.success && result.data) {
        onCharacterDataExtracted(result.data);
      } else {
        setError(result.message || 'Error al procesar la imagen');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">📸 Escanear Hoja</h2>
          <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded flex gap-2">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <Loader size={32} className="text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-semibold">Procesando imagen...</p>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay={true}
          muted={true}
          playsInline={true}
          style={{ 
            width: '100%',
            height: showVideo ? '300px' : '0px',
            objectFit: 'cover',
            backgroundColor: '#000',
            display: showVideo ? 'block' : 'none',
            minHeight: showVideo ? '300px' : '0px',
            transition: 'all 0.3s ease'
          }}
        />

        {showVideo && !capturedImage && (
          <>
            <div className="mb-4 bg-black rounded-lg overflow-hidden relative border-4 border-blue-500">
              <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 z-10">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                EN VIVO
              </div>
            </div>
            <p className="text-sm text-gray-600 text-center mb-4">Apunta a la hoja de personaje</p>
            <button
              onClick={capturePhoto}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-semibold"
            >
              <Camera size={20} /> Capturar
            </button>
          </>
        )}

        {capturedImage && !loading && (
          <>
            <div className="mb-4 bg-gray-100 rounded-lg overflow-hidden">
              <img src={capturedImage} alt="Captura" className="w-full aspect-video object-cover" />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCapturedImage(null)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold"
              >
                Retomar
              </button>
              <button
                onClick={() => processImage(capturedImage)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold"
              >
                Procesar
              </button>
            </div>
          </>
        )}

        {!showVideo && !capturedImage && !loading && (
          <>
            <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-900 mb-2 font-bold">Asegúrate de:</p>
              <ul className="text-sm text-purple-800 list-disc list-inside space-y-1">
                <li>Tener buena iluminación</li>
                <li>Que la hoja se vea completa</li>
                <li>Permitir el acceso a la cámara en el navegador</li>
              </ul>
            </div>

            <button
              onClick={startCamera}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg flex items-center justify-center gap-2 font-semibold mb-3 text-lg transition-all hover:shadow-lg"
            >
              <Camera size={24} /> Abrir Cámara
            </button>
            
            <div className="text-center text-gray-600 text-sm my-3">— o —</div>
            
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold transition-all hover:shadow-md"
            >
              <Upload size={20} /> Subir Archivo
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    setCapturedImage(ev.target?.result);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="hidden"
            />
          </>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
