import * as faceapi from '@vladmandic/face-api';
import { getUsers } from './store';

export const loadModels = async () => {
  const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
};

export const getFaceMatcher = async () => {
  const users = await getUsers();
  if (users.length === 0) return null;

  const labeledDescriptors = users.map(user => {
    const descriptor = new Float32Array(user.descriptor);
    return new faceapi.LabeledFaceDescriptors(user.id, [descriptor]);
  });

  return new faceapi.FaceMatcher(labeledDescriptors, 0.6);
};
