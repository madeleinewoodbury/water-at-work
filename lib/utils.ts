import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDisplayName(user: { display_name?: string | null; email: string }): string {
  return user.display_name || user.email.split('@')[0]
}

function formatOneDecimal(value: number): string {
  return value % 1 === 0 ? String(value) : value.toFixed(1)
}

export function formatWaterAmount(oz: number): string {
  if (oz >= 128) {
    const gal = oz / 128
    return `${formatOneDecimal(gal)} gal`
  }
  return `${formatOneDecimal(oz)} oz`
}
