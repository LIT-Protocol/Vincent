import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Utility function to wait for a specified amount of time
 * @param time Time to wait in milliseconds (default: 3000ms)
 */
export async function wait(time = 3_000): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, time));
}
