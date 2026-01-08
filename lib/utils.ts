import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format student ID as "S-01", "S-02", etc.
 * @param studentId - The student ID number
 * @returns Formatted string like "S-01", "S-02", "S-100", etc.
 */
export function formatStudentId(studentId: number | null | undefined): string {
  if (studentId === null || studentId === undefined) return "N/A";
  return `S-${String(studentId).padStart(2, "0")}`;
}
