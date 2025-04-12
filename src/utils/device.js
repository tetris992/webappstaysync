// webapp/src/utils/device.js
import { v4 as uuidv4 } from 'uuid';

export const getDeviceToken = () => {
  let deviceToken = localStorage.getItem('deviceToken');
  if (!deviceToken) {
    deviceToken = uuidv4();
    localStorage.setItem('deviceToken', deviceToken);
    console.log('Generated new deviceToken:', deviceToken);
  }
  return deviceToken;
};