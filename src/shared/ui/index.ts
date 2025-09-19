// Re-export components that will be shared across applications
export { Button } from './components/button';
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './components/card';
export { MetricCard } from './components/metric-card';
export { Sidebar } from './components/sidebar';
export { Header } from './components/header';
export { Layout } from './components/layout';
export { ThemeProvider } from './components/theme-provider';
export { Input } from './components/input';
export { Textarea } from './components/textarea';
export { Label } from './components/label';
export { Switch } from './components/switch';
export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, useFormField } from './components/form';
export { 
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
} from './components/select';
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './components/table';
export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './components/dialog';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './components/tabs';

// Logo components
export { Logo, LogoIcon, LogoText, LogoWhite } from './components/logo';

// Utilities
export { cn } from './utils';

// Types
export type { SidebarItem, SidebarProps } from './components/sidebar';
export type { HeaderProps } from './components/header';
export type { LayoutProps } from './components/layout';
export type { MetricCardProps } from './components/metric-card';

// More component exports will be added as they are migrated