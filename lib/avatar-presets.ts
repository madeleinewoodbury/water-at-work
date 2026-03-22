export interface IconPreset {
  id: string
  iconName: string
  bg: string
  fg: string
}

export const ICON_PRESETS: IconPreset[] = [
  { id: 'droplets-blue',     iconName: 'Droplets',  bg: 'bg-blue-500',    fg: 'text-white' },
  { id: 'waves-sky',         iconName: 'Waves',     bg: 'bg-sky-400',     fg: 'text-white' },
  { id: 'fish-teal',         iconName: 'Fish',      bg: 'bg-teal-500',    fg: 'text-white' },
  { id: 'shell-cyan',        iconName: 'Shell',     bg: 'bg-cyan-500',    fg: 'text-white' },
  { id: 'sun-amber',         iconName: 'Sun',       bg: 'bg-amber-400',   fg: 'text-white' },
  { id: 'leaf-green',        iconName: 'Leaf',      bg: 'bg-green-600',   fg: 'text-white' },
  { id: 'mountain-slate',    iconName: 'Mountain',  bg: 'bg-slate-600',   fg: 'text-white' },
  { id: 'cloud-rain-indigo', iconName: 'CloudRain', bg: 'bg-indigo-500',  fg: 'text-white' },
  { id: 'snowflake-sky',     iconName: 'Snowflake', bg: 'bg-sky-200',     fg: 'text-slate-700' },
  { id: 'flame-orange',      iconName: 'Flame',     bg: 'bg-orange-500',  fg: 'text-white' },
  { id: 'wind-violet',       iconName: 'Wind',      bg: 'bg-violet-500',  fg: 'text-white' },
  { id: 'star-yellow',       iconName: 'Star',      bg: 'bg-yellow-400',  fg: 'text-slate-700' },
  { id: 'heart-rose',        iconName: 'Heart',     bg: 'bg-rose-500',    fg: 'text-white' },
  { id: 'globe-emerald',     iconName: 'Globe',     bg: 'bg-emerald-500', fg: 'text-white' },
  { id: 'flower-pink',       iconName: 'Flower2',   bg: 'bg-pink-400',    fg: 'text-white' },
  { id: 'moon-indigo',       iconName: 'Moon',      bg: 'bg-indigo-700',  fg: 'text-white' },
]

export function getIconPreset(id: string): IconPreset | undefined {
  return ICON_PRESETS.find((p) => p.id === id)
}
