import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import { getFaceMatcher } from '../lib/face';
import { logAttendance, getUsers } from '../lib/store';
import { CheckCircle, UserCheck, Camera as CameraIcon, Upload, AlertCircle } from 'lucide-react';

export function Kiosk() {
  const webcamRef = useRef<Webcam>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastLog, setLastLog] = useState<{name: string, time: string} | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  
  const lastLoggedRef = useRef<Record<string, number>>({});
  const matcherRef = useRef<faceapi.FaceMatcher | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const init = async () => {
      matcherRef.current = await getFaceMatcher();
      setIsScanning(true);
    };
    init();

    return () => {
      if (scanIntervalRef.current) window.clearInterval(scanIntervalRef.current);
    };
  }, []);

  // Camera continuous scanning
  useEffect(() => {
    if (!isScanning || !matcherRef.current || mode !== 'camera') return;

    const scan = async () => {
      if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
        const video = webcamRef.current.video;
        try {
          const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();
          processDetections(detections);
        } catch (err) {
          console.error("Scanning error:", err);
        }
      }
    };

    scanIntervalRef.current = window.setInterval(scan, 1000);

    return () => {
      if (scanIntervalRef.current) window.clearInterval(scanIntervalRef.current);
    };
  }, [isScanning, mode]);

  const processDetections = async (detections: faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68>>[]) => {
    if (detections.length > 0 && matcherRef.current) {
      let foundMatch = false;
      for (const detection of detections) {
        const bestMatch = matcherRef.current!.findBestMatch(detection.descriptor);
        if (bestMatch.label !== 'unknown') {
          foundMatch = true;
          const now = Date.now();
          const lastLogTime = lastLoggedRef.current[bestMatch.label] || 0;
          
          // Cooldown of 10 seconds for demo
          if (now - lastLogTime > 10000) {
            lastLoggedRef.current[bestMatch.label] = now;
            const log = await logAttendance(bestMatch.label);
            if (log) {
              setLastLog({ name: log.name, time: new Date(log.timestamp).toLocaleTimeString() });
              setErrorMsg(null);
              setTimeout(() => setLastLog(null), 4000);
            }
          } else if (mode === 'upload') {
            // Give immediate feedback in upload mode even if on cooldown
            setErrorMsg(`Attendance already logged recently for ${bestMatch.label}`);
            setTimeout(() => setErrorMsg(null), 3000);
          }
        }
      }

      if (!foundMatch && mode === 'upload') {
        setErrorMsg("Face detected, but employee not recognized.");
        setTimeout(() => setErrorMsg(null), 3000);
      }
    } else if (mode === 'upload') {
      setErrorMsg("No face detected in the image.");
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      setLastLog(null);
      setErrorMsg(null);
    }
  };

  const scanUploadedImage = async () => {
    if (!imgRef.current || !matcherRef.current) return;
    try {
      const detections = await faceapi.detectAllFaces(imgRef.current).withFaceLandmarks().withFaceDescriptors();
      processDetections(detections);
    } catch (err) {
      console.error("Image scan error:", err);
      setErrorMsg("Error processing image.");
    }
  };

  const [usersCount, setUsersCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const users = await getUsers();
      setUsersCount(users.length);
    };
    fetchUsers();
  }, []);

  if (usersCount === null) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  if (usersCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <UserCheck size={64} className="mb-6 opacity-50 text-slate-400" />
        <h2 className="text-2xl font-semibold text-slate-700">No Employees Registered</h2>
        <p className="mt-2 text-slate-500">Please register employees first to use the attendance kiosk.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center bg-slate-50 p-8">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-slate-800">Attendance Kiosk</h1>
        <p className="text-slate-500 mt-3 text-lg">
          {mode === 'camera' ? 'Please look directly at the camera to log your attendance' : 'Upload a photo to test attendance logging'}
        </p>
      </div>

      <div className="mb-8 flex bg-slate-200 p-1 rounded-lg">
        <button
          onClick={() => setMode('camera')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-medium transition-colors ${mode === 'camera' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <CameraIcon size={18} /> Live Camera
        </button>
        <button
          onClick={() => setMode('upload')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-medium transition-colors ${mode === 'upload' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Upload size={18} /> Test with Image
        </button>
      </div>

      {mode === 'upload' && (
        <div className="mb-6 w-full max-w-md">
          <input 
            type="file" 
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
      )}

      <div className="relative w-full max-w-4xl bg-black rounded-3xl overflow-hidden shadow-2xl aspect-video border-[6px] border-slate-800 flex items-center justify-center">
        {mode === 'camera' ? (
          <React.Fragment>
            {/* @ts-expect-error react-webcam types are overly strict */}
            <Webcam
              ref={webcamRef}
              audio={false}
              videoConstraints={{ facingMode: "user" }}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 border-8 border-blue-500/20 rounded-2xl pointer-events-none"></div>
            <div className="absolute top-6 right-6 flex items-center gap-3 bg-black/60 text-white px-4 py-2 rounded-full backdrop-blur-md text-sm font-medium border border-white/10">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
              Scanning Active
            </div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            {imageSrc ? (
              <img 
                ref={imgRef} 
                src={imageSrc} 
                alt="Test attendance" 
                className="w-full h-full object-contain bg-black"
                onLoad={scanUploadedImage} 
              />
            ) : (
              <div className="text-slate-500 flex flex-col items-center">
                <Upload size={64} className="mb-4 opacity-50" />
                <p className="text-xl">Upload an image to scan</p>
              </div>
            )}
          </React.Fragment>
        )}

        {/* Success Toast */}
        {lastLog && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-green-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce border border-green-400 z-10">
            <CheckCircle size={32} className="shrink-0" />
            <div>
              <p className="font-bold text-lg">{lastLog.name}</p>
              <p className="text-sm opacity-90">Attendance logged at {lastLog.time}</p>
            </div>
          </div>
        )}

        {/* Error Toast */}
        {errorMsg && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-red-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-red-400 z-10">
            <AlertCircle size={32} className="shrink-0" />
            <p className="font-bold">{errorMsg}</p>
          </div>
        )}
      </div>
    </div>
  );
}
