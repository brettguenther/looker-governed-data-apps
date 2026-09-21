import React from 'react';
import type { GovernedAppProps } from '../types/looker';

const BasicEcommApp = React.lazy(() =>
  import('./basic-ecomm/BasicEcommApp').then((m) => ({ default: m.BasicEcommApp }))
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
};

export const getAllRegisteredApps = (): GovernedAppDefinition[] => {
  return Object.values(APP_REGISTRY);
};

export const getRegisteredApp = (id: string): GovernedAppDefinition | undefined => {
  return APP_REGISTRY[id];
};

export const getDefaultApp = (): GovernedAppDefinition => {
  return APP_REGISTRY['basic-ecomm'] || Object.values(APP_REGISTRY)[0];
};
