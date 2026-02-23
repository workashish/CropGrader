import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Camera,
  Images,
  IndianRupee,
  Bug,
  BarChart3,
  Leaf,
  ChevronLeft,
  ChevronRight,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/grader', label: 'Single Crop Grader', icon: Camera },
  { path: '/batch', label: 'Batch Grading', icon: Images },
  { path: '/price', label: 'Price Estimator', icon: IndianRupee },
  { path: '/pest', label: 'Pest & Disease', icon: Bug },
  { path: '/accuracy', label: 'Accuracy Dashboard', icon: BarChart3 },
  { path: '/history', label: 'Grading History', icon: History },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "hidden lg:flex fixed top-0 left-0 h-screen bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border flex-col transition-all duration-500 ease-in-out shadow-2xl z-50",
        collapsed ? "w-20" : "w-72"
      )}
    >
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border/50 flex items-center gap-4">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-emerald-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ring-1 ring-white/20">
          <Leaf className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden space-y-0.5">
            <h1 className="font-bold text-lg tracking-tight text-sidebar-foreground">AgriGrade</h1>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Enterprise Edition</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                isActive
                  ? "bg-gradient-to-r from-primary to-emerald-700 text-white shadow-md shadow-emerald-900/20"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary"
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
              <Icon className={cn("w-5 h-5 flex-shrink-0 transition-colors", isActive ? "text-white" : "text-muted-foreground group-hover:text-primary")} />
              {!collapsed && (
                <span className="text-sm font-medium tracking-wide">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-4 border-t border-sidebar-border/50">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center hover:bg-sidebar-accent h-10 rounded-xl"
          onClick={() => onToggle()}
        >
          {collapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronLeft className="w-4 h-4 text-muted-foreground" />}
          {!collapsed && <span className="ml-2 text-sm text-sidebar-foreground/80">Collapse Sidebar</span>}
        </Button>
      </div>
    </aside>
  );
}
