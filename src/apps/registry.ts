import { SalesOverviewApp } from './sales-overview/SalesOverviewApp';
import { UserCohortsApp } from './user-cohorts/UserCohortsApp';
import React from 'react';
import type { GovernedAppProps } from '../types/looker';
import { BasicEcommApp } from './basic-ecomm/BasicEcommApp';
import { SalesAnalyticsApp } from './sales-analytics/SalesAnalyticsApp';

export interface GovernedAppDefinition {
  id: string;
  name: string;
  description: string;
  model: string;
  view: string;
  category?: string;
  icon?: string;
  component: React.ComponentType<GovernedAppProps>;
}

export const APP_REGISTRY: Record<string, GovernedAppDefinition> = {
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

  'user-cohorts': {
    id: 'user-cohorts',
    name: 'User Cohorts',
    description: 'AI-generated application for basic_ecomm :: basic_users',
    model: 'basic_ecomm',
    view: 'basic_users',
    category: 'Audience',
    icon: 'Layers',
    component: UserCohortsApp,
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
  'sales-analytics': {
    id: 'sales-analytics',
    name: 'Sales Performance',
    description: 'Channel revenue, product categories, and quota tracking',
    model: 'edg_orders',
    view: 'fct_orders',
    category: 'Sales',
    icon: 'TrendingUp',
    component: SalesAnalyticsApp,
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
