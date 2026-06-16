// Hardcoded data maps for SmartOrderInsights, extracted for reuse

import {
  CloudSun,
  Cloud,
  CloudRain,
  Thermometer,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Droplets,
  ShoppingBasket,
} from 'lucide-react';

export interface InsightItem {
  type: 'positive' | 'warning' | 'negative' | 'info';
  icon: React.ElementType;
  title: string;
  description: string;
  impact?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface BranchForecast {
  totalItems: number;
  estimatedSpend: string;
  changeFromLastWeek: string;
  topItems: string[];
}

export interface BranchWeather {
  temp: number;
  condition: string;
  humidity: number;
  wind: number;
  icon: React.ElementType;
}

// Sample per-branch data
export const BRANCH_FORECASTS: Record<string, BranchForecast> = {
  'T.Nagar': {
    totalItems: 38,
    estimatedSpend: '₹22,300',
    changeFromLastWeek: '+12%',
    topItems: ['Tomato', 'Onion', 'Paneer', 'Coriander', 'Capsicum'],
  },
  'Anna Nagar': {
    totalItems: 45,
    estimatedSpend: '₹26,800',
    changeFromLastWeek: '+5%',
    topItems: ['Potato', 'Tomato', 'Onion', 'Green Chilli', 'Beans'],
  },
  'Kilpauk': {
    totalItems: 28,
    estimatedSpend: '₹14,200',
    changeFromLastWeek: '-3%',
    topItems: ['Tomato', 'Onion', 'Carrot', 'Brinjal', 'Drumstick'],
  },
  'Nolambur': {
    totalItems: 32,
    estimatedSpend: '₹16,500',
    changeFromLastWeek: '+8%',
    topItems: ['Onion', 'Potato', 'Tomato', 'Lady Finger', 'Coriander'],
  },
  'OMR': {
    totalItems: 52,
    estimatedSpend: '₹31,200',
    changeFromLastWeek: '+15%',
    topItems: ['Tomato', 'Paneer', 'Mushroom', 'Capsicum', 'Broccoli'],
  },
  'Mount Road': {
    totalItems: 41,
    estimatedSpend: '₹24,600',
    changeFromLastWeek: '+2%',
    topItems: ['Onion', 'Tomato', 'Potato', 'Beans', 'Carrot'],
  },
  'Nanganallur': {
    totalItems: 35,
    estimatedSpend: '₹18,900',
    changeFromLastWeek: '-1%',
    topItems: ['Tomato', 'Onion', 'Coriander', 'Green Chilli', 'Curry Leaves'],
  },
};

export const BRANCH_INSIGHTS: Record<string, InsightItem[]> = {
  'T.Nagar': [
    {
      type: 'warning',
      icon: Thermometer,
      title: 'High Temperature Alert',
      description: '34°C expected. Leafy greens demand drops 15% in heat. Reduce palak & spinach quantities.',
      impact: 'MEDIUM',
    },
    {
      type: 'positive',
      icon: TrendingUp,
      title: 'Weekend Rush Expected',
      description: 'T.Nagar sees 25% higher footfall on weekends. Paneer and capsicum demand will spike.',
      impact: 'HIGH',
    },
    {
      type: 'negative',
      icon: Droplets,
      title: 'Tomato Price Surge',
      description: 'Rain in Kolar disrupted supply. Tomato prices up 18% this week — consider alternatives.',
      impact: 'HIGH',
    },
    {
      type: 'info',
      icon: Lightbulb,
      title: 'Coriander Waste Alert',
      description: '3.2kg coriander wasted last week at T.Nagar. Order 15% less this cycle.',
      impact: 'LOW',
    },
  ],
  'Anna Nagar': [
    {
      type: 'positive',
      icon: TrendingUp,
      title: 'Strong Demand Trend',
      description: 'Anna Nagar orders grew 5% week-over-week. Potato and beans are the top movers.',
      impact: 'MEDIUM',
    },
    {
      type: 'warning',
      icon: ShoppingBasket,
      title: 'Green Chilli Shortage',
      description: 'Supplier flagged limited green chilli availability. Pre-order extra or find backup vendor.',
      impact: 'HIGH',
    },
    {
      type: 'negative',
      icon: TrendingDown,
      title: 'Onion Price Spike',
      description: 'Onion rates up ₹8/kg from last week due to transport delays. Budget impact: ~₹1,200.',
      impact: 'MEDIUM',
    },
    {
      type: 'info',
      icon: Lightbulb,
      title: 'Reorder Pattern',
      description: 'Anna Nagar typically reorders beans mid-week. Consider splitting the order.',
      impact: 'LOW',
    },
  ],
  'Kilpauk': [
    {
      type: 'warning',
      icon: Thermometer,
      title: 'Demand Dip Expected',
      description: 'Kilpauk orders dropped 3% last week. Brinjal and drumstick moving slower — reduce quantities.',
      impact: 'MEDIUM',
    },
    {
      type: 'positive',
      icon: TrendingUp,
      title: 'Carrot Demand Steady',
      description: 'Carrot consumption at Kilpauk is consistent. Keep current order volume.',
      impact: 'LOW',
    },
    {
      type: 'info',
      icon: Lightbulb,
      title: 'Cost Optimization',
      description: 'Switching to local drumstick supplier could save ₹450/week for this branch.',
      impact: 'MEDIUM',
    },
  ],
  'OMR': [
    {
      type: 'positive',
      icon: TrendingUp,
      title: 'Fastest Growing Branch',
      description: 'OMR orders surged 15% this week. Mushroom and broccoli are driving premium segment growth.',
      impact: 'HIGH',
    },
    {
      type: 'warning',
      icon: ShoppingBasket,
      title: 'Paneer Stock Risk',
      description: 'Current supplier has 2-day lead time. OMR paneer demand is 3x other branches — buffer stock recommended.',
      impact: 'HIGH',
    },
    {
      type: 'info',
      icon: Lightbulb,
      title: 'Premium Item Trend',
      description: 'OMR customers order 40% more premium items (mushroom, broccoli, zucchini) than average.',
      impact: 'MEDIUM',
    },
  ],
};

export const BRANCH_WEATHER: Record<string, BranchWeather> = {
  'T.Nagar': { temp: 34, condition: 'Partly Cloudy', humidity: 72, wind: 12, icon: CloudSun },
  'Anna Nagar': { temp: 33, condition: 'Cloudy', humidity: 75, wind: 10, icon: Cloud },
  'Kilpauk': { temp: 33, condition: 'Partly Cloudy', humidity: 70, wind: 14, icon: CloudSun },
  'Nolambur': { temp: 32, condition: 'Light Rain', humidity: 82, wind: 8, icon: CloudRain },
  'OMR': { temp: 35, condition: 'Sunny', humidity: 65, wind: 16, icon: CloudSun },
  'Mount Road': { temp: 34, condition: 'Partly Cloudy', humidity: 74, wind: 11, icon: CloudSun },
  'Nanganallur': { temp: 33, condition: 'Cloudy', humidity: 78, wind: 9, icon: Cloud },
};

export const DEFAULT_WEATHER: BranchWeather = {
  temp: 34,
  condition: 'Partly Cloudy',
  humidity: 72,
  wind: 12,
  icon: CloudSun,
};

export const DEFAULT_FORECAST: BranchForecast = {
  totalItems: 42,
  estimatedSpend: '₹18,450',
  changeFromLastWeek: '+8%',
  topItems: ['Tomato', 'Onion', 'Potato', 'Coriander', 'Green Chilli'],
};

export const DEFAULT_INSIGHTS: InsightItem[] = [
  {
    type: 'warning',
    icon: Thermometer,
    title: 'High Temperature Alert',
    description: '34°C expected tomorrow. Leafy greens and dairy demand typically drops 15% in heat.',
    impact: 'MEDIUM',
  },
  {
    type: 'positive',
    icon: TrendingUp,
    title: 'Weekend Demand Surge',
    description: 'Weekends see 20% higher orders on average. Onion, tomato, and potato volumes peak.',
    impact: 'HIGH',
  },
  {
    type: 'info',
    icon: Lightbulb,
    title: 'Waste Reduction Tip',
    description: 'Last week, 8kg of coriander was wasted across branches. Consider ordering 10% less.',
    impact: 'LOW',
  },
];
