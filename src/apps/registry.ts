import React from 'react';
import type { GovernedAppProps } from '../types/looker';

const BasicEcommApp = React.lazy(() =>
  import('./basic-ecomm/BasicEcommApp').then((m) => ({ default: m.BasicEcommApp }))
);
const SalesOverviewApp = React.lazy(() =>
  import('./sales-overview/SalesOverviewApp').then((m) => ({ default: m.SalesOverviewApp }))
);

const NycCitibikeTripsApp = React.lazy(() =>
  import('./nyc-citibike-trips/NycCitibikeTripsApp').then((m) => ({ default: m.NycCitibikeTripsApp }))
);

export interface GovernedAppDefinition {
  id: string;
  name: string;
  description: string;
  model: string;
  view: string;
  category?: string;
  icon?: string;
  component: React.ComponentType<GovernedAppProps> | React.LazyExoticComponent<React.ComponentType<GovernedAppProps>>;
}

export const APP_REGISTRY: Record<string, GovernedAppDefinition> = {
  'nyc-citibike-trips': {
    id: 'nyc-citibike-trips',
    name: 'NYC Citi Bike Analytics',
    description: 'Ridership trends, commuting patterns, station performance, and demographic analytics',
    model: 'nyc_citibike_trips',
    view: 'trips',
    category: 'Transportation',
    icon: 'Bike',
    component: NycCitibikeTripsApp,
  },
  'basic-ecomm': {
    id: 'basic-ecomm',
    name: 'E-Commerce Overview',
    description: 'Executive revenue, category breakdowns, and order trends',
    model: 'basic_ecomm',
    view: 'basic_order_items',
    category: 'Retail',
    icon: 'ShoppingCart',
    component: BasicEcommApp,
  },
  'sales-overview': {
    id: 'sales-overview',
    name: 'Sales Overview',
    description: 'Executive revenue, monthly trends, category performance, and geographic sales',
    model: 'look_ecomm',
    view: 'order_items',
    category: 'Sales',
    icon: 'TrendingUp',
    component: SalesOverviewApp,
  },
};

export const getAllRegisteredApps = (): GovernedAppDefinition[] => {
  return Object.values(APP_REGISTRY);
};

export const getRegisteredApp = (id: string): GovernedAppDefinition | undefined => {
  return APP_REGISTRY[id];
};

export const getDefaultApp = (): GovernedAppDefinition => {
  return APP_REGISTRY['nyc-citibike-trips'] || Object.values(APP_REGISTRY)[0];
};
