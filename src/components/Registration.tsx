import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import { saveUser } from '../lib/store';
import { CheckCircle, AlertCircle, Upload, Camera as CameraIcon } from 'lucide-react';

export function Registration() {
  const webcamRef = useRef<Webcam>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      setStatus('idle');
      setMessage('');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!name.trim()) {
      setStatus('error');
      setMessage('Employee name is required');
      return;
    }
    if (name.trim().length < 2) {
      setStatus('error');
      setMessage('Employee name must be at least 2 characters');
      return;
    }
    if (!employeeId.trim()) {
      setStatus('error');
      setMessage('Employee ID is required');
      return;
    }
    if (employeeId.trim().length < 1 || employeeId.trim().length > 50) {
      setStatus('error');
      setMessage('Employee ID should be between 1-50 characters');
      return;
    }

    if (mode === 'upload' && !imageSrc) {
      setStatus('error');
      setMessage('Please upload an image first');
      return;
    }

    setStatus('scanning');
    setMessage('Scanning face... Please wait');

    try {
      let detection;
      
      if (mode === 'camera' && webcamRef.current && webcamRef.current.video) {
        detection = await faceapi.detectSingleFace(webcamRef.current.video).withFaceLandmarks().withFaceDescriptor();
      } else if (mode === 'upload' && imgRef.current) {
        detection = await faceapi.detectSingleFace(imgRef.current).withFaceLandmarks().withFaceDescriptor();
      }

      if (detection) {
        const descriptorArray = Array.from(detection.descriptor) as number[];
        const result = await saveUser({ name: name.trim(), employeeId: employeeId.trim(), descriptor: descriptorArray });
        
        if (result) {
          setStatus('success');
          setMessage(`✅ Employee "${name}" registered successfully!`);
          setTimeout(() => {
            setName('');
            setEmployeeId('');
            setStatus('idle');
            if (mode === 'upload') setImageSrc(null);
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Failed to save employee data. Please try again.');
        }
      } else {
        setStatus('error');
        setMessage('❌ No face detected. Ensure good lighting and face is clearly visible.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('❌ Error during face detection. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Register New Employee</h2>
          <p className="text-slate-500 mt-2">Capture employee facial data for the attendance system.</p>
        </div>
        <div className="flex bg-slate-200 p-1 rounded-lg">
          <button
            onClick={() => setMode('camera')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'camera' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <CameraIcon size={16} /> Camera
          </button>
          <button
            onClick={() => setMode('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'upload' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Upload size={16} /> Upload Image
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                placeholder="e.g. Jane Doe" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Employee ID</label>
              <input 
                type="text" 
                value={employeeId} 
                onChange={e => setEmployeeId(e.target.value)} 
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                placeholder="e.g. EMP-001" 
              />
            </div>
            
            {mode === 'upload' && (
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Upload Photo</label>
                 <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            )}

            <button 
              type="submit" 
              disabled={status === 'scanning'} 
              className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium text-lg mt-4"
            >
              {status === 'scanning' ? 'Scanning...' : 'Capture & Register'}
            </button>
          </form>

          {status === 'success' && (
            <div className="mt-6 p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-3 border border-green-100">
              <CheckCircle size={24} className="shrink-0" />
              <p className="font-medium">{message}</p>
            </div>
          )}
          {status === 'error' && (
            <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 border border-red-100">
              <AlertCircle size={24} className="shrink-0" />
              <p className="font-medium">{message}</p>
            </div>
          )}
        </div>
        
        <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-video relative flex items-center justify-center shadow-lg border-4 border-slate-800">
          {mode === 'camera' ? (
            <React.Fragment>
              {/* @ts-expect-error react-webcam types are overly strict */}
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "user" }}
                className="w-full h-full object-cover"
              />
            </React.Fragment>
          ) : (
            <React.Fragment>
              {imageSrc ? (
                <img ref={imgRef} src={imageSrc} alt="Upload preview" className="w-full h-full object-contain bg-black" />
              ) : (
                <div className="text-slate-500 flex flex-col items-center">
                  <Upload size={48} className="mb-4 opacity-50" />
                  <p>Upload an image to preview</p>
                </div>
              )}
            </React.Fragment>
          )}
          
          {status === 'scanning' && (
            <div className="absolute inset-0 border-4 border-blue-500 border-dashed animate-pulse rounded-xl pointer-events-none"></div>
          )}
        </div>
      </div>
    </div>
  );
}
