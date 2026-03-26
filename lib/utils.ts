import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDisplayName(user: { display_name?: string | null; email: string }): string {
  return user.display_name || user.email.split('@')[0]
}

export function formatOneDecimal(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1)
}

export function formatWaterAmount(oz: number): string {
  if (oz >= 128) {
    const gal = oz / 128
    return `${formatOneDecimal(gal)} gal`
  }
  return `${formatOneDecimal(oz)} oz`
}
