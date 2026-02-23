import { useLocation, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const pageTitles: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Dashboard',
    description: 'Overview of your crop grading system'
  },
  '/grader': {
    title: 'Single Crop Grader',
    description: 'Upload and analyze individual crop images'
  },
  '/batch': {
    title: 'Batch Grading',
    description: 'Analyze multiple crop images simultaneously'
  },
  '/price': {
    title: 'Price Estimator',
    description: 'Calculate fair market prices based on quality grades'
  },
  '/pest': {
    title: 'Pest & Disease Detection',
    description: 'Identify crop issues and get treatment guidance'
  },
  '/accuracy': {
    title: 'Accuracy Dashboard',
    description: 'System performance metrics and evaluation'
  },
  '/history': {
    title: 'Grading History',
    description: 'View and export your grading data'
  },
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

type HealthState = {
  status: 'checking' | 'online' | 'offline';
  geminiConfigured: boolean | null;
  lastCheck: string | null;
};

export function Header() {
  const location = useLocation();
  const pageInfo = pageTitles[location.pathname] || pageTitles['/'];
  const { user, signOut } = useAuthContext();
  const { language, setLanguage, options } = useLanguage();
  const { toast } = useToast();
  const [health, setHealth] = useState<HealthState>({
    status: 'checking',
    geminiConfigured: null,
    lastCheck: null,
  });

  useEffect(() => {
    let mounted = true;

    const fetchHealth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) {
          throw new Error(`Health check failed (${response.status})`);
        }
        const data = await response.json();
        if (!mounted) return;
        setHealth({
          status: 'online',
          geminiConfigured: typeof data.geminiConfigured === 'boolean' ? data.geminiConfigured : null,
          lastCheck: data.timestamp || null,
        });
      } catch (error) {
        if (!mounted) return;
        setHealth({
          status: 'offline',
          geminiConfigured: null,
          lastCheck: new Date().toISOString(),
        });
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Signed out', description: 'You have been signed out successfully.' });
    }
  };

  const geminiBadge = health.status !== 'online'
    ? { label: 'Gemini Status Unknown', tone: 'bg-muted/60 border-border text-muted-foreground' }
    : health.geminiConfigured
      ? { label: 'Gemini Ready', tone: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700' }
      : { label: 'Gemini Not Configured', tone: 'bg-amber-500/10 border-amber-500/20 text-amber-700' };

  return (
    <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-40 transition-all duration-300">
      <div className="px-4 sm:px-8 py-4 sm:h-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{pageInfo.title}</h1>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">{pageInfo.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Gemini Status Badge */}
          <div className={`flex items-center gap-2.5 px-4 py-1.5 rounded-full shadow-sm border ${geminiBadge.tone}`}>
            <span className="relative flex h-2.5 w-2.5">
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${health.status === 'online' && health.geminiConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide">{geminiBadge.label}</span>
          </div>

          <div data-no-translate="true" className="min-w-[160px]">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.code} value={option.code}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-3 h-10 px-3 hover:bg-secondary hover:text-primary rounded-full border border-transparent hover:border-border transition-all">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-emerald-700 rounded-full flex items-center justify-center text-white shadow-md">
                <User className="w-4 h-4" />
              </div>
              <div className="hidden sm:flex flex-col items-start space-y-0.5">
                <span className="text-sm font-semibold leading-none text-foreground">
                  {user?.email?.split('@')[0]}
                </span>
                <span className="text-[10px] text-muted-foreground leading-none">Admin</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 shadow-xl border-border/50">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Account</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to="/history">View History</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer hover:bg-destructive/10">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </div>

    </header>
  );
}
