import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { path: '/procurement', label: 'Overview' },
  { path: '/procurement/agent', label: 'Agent' },
  { path: '/procurement/forecast', label: 'Forecast' },
];

export default function ProcurementNav() {
  const { pathname } = useLocation();
  return (
    <nav className="flex gap-1 border-b mb-6 overflow-x-auto">
      {tabs.map((tab) => (
        <Link
          key={tab.path}
          to={tab.path}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
            pathname === tab.path
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
