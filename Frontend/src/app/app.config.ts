import { ApplicationConfig, provideBrowserGlobalErrorListeners, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  LucideAngularModule,
  FileSpreadsheet,
  Play,
  BarChart3,
  Plus,
  Trash2,
  Save,
  Copy,
  Info,
  Check,
  X,
  Search,
  LayoutDashboard,
  Activity,
  Target,
  ScrollText,
  Binary,
  Upload,
  History,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Maximize
} from 'lucide-angular';


import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(LucideAngularModule.pick({
      FileSpreadsheet,
      Play,
      BarChart3,
      Plus,
      Trash2,
      Save,
      Copy,
      Info,
      Check,
      X,
      Search,
      LayoutDashboard,
      Activity,
      Target,
      ScrollText,
      Binary,
      Upload,
      History,
      ChevronLeft,
      ChevronRight,
      ChevronUp,
      ChevronDown,
      Maximize
    }))
  ]
};
