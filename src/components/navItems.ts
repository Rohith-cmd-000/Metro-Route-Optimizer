import { GitBranch, Info, MapPinned, Route, TrainFront } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type ScreenId = 'home' | 'results' | 'network' | 'dsa' | 'about';

export interface NavItem {
  id: ScreenId;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Plan Journey', icon: Route },
  { id: 'results', label: 'Route Results', icon: TrainFront },
  { id: 'network', label: 'Network', icon: MapPinned },
  { id: 'dsa', label: 'DSA Lab', icon: GitBranch },
  { id: 'about', label: 'About', icon: Info },
];
