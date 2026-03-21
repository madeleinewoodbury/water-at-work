import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDisplayName(user: { display_name?: string | null; email: string }): string {
  return user.display_name || user.email.split('@')[0]
}
