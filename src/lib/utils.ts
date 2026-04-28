import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for merging tailwind classes safely.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Audio feedback for scan
 */
export const playScanSound = () => {
  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  audio.play().catch(e => console.error('Audio play failed:', e));
};

/**
 * Haptic feedback
 */
export const triggerVibrate = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(200);
  }
};
