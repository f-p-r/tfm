import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgClass } from '@angular/common';

interface ThemeColor {
  token: string;
  cssVar: string;
  hex: string;
  bgClass: string;
  textClass: string;
}

interface ThemeColorCard {
  id: string;
  background: ThemeColor;
  text: ThemeColor;
}

const THEME_COLORS: ThemeColor[] = [
  {
    token: 'transparent',
    cssVar: '--color-transparent',
    hex: 'transparent',
    bgClass: 'bg-transparent',
    textClass: 'text-transparent',
  },
  {
    token: 'brand-primary',
    cssVar: '--color-brand-primary',
    hex: '#1B4F72',
    bgClass: 'bg-brand-primary',
    textClass: 'text-brand-primary',
  },
  {
    token: 'brand-secondary',
    cssVar: '--color-brand-secondary',
    hex: '#F4CB42',
    bgClass: 'bg-brand-secondary',
    textClass: 'text-brand-secondary',
  },
  {
    token: 'brand-accent',
    cssVar: '--color-brand-accent',
    hex: '#48C9B0',
    bgClass: 'bg-brand-accent',
    textClass: 'text-brand-accent',
  },
  {
    token: 'brand-primary-light',
    cssVar: '--color-brand-primary-light',
    hex: '#C5D7E4',
    bgClass: 'bg-brand-primary-light',
    textClass: 'text-brand-primary-light',
  },
  {
    token: 'brand-secondary-light',
    cssVar: '--color-brand-secondary-light',
    hex: '#FDF3D7',
    bgClass: 'bg-brand-secondary-light',
    textClass: 'text-brand-secondary-light',
  },
  {
    token: 'brand-accent-light',
    cssVar: '--color-brand-accent-light',
    hex: '#D0F0E8',
    bgClass: 'bg-brand-accent-light',
    textClass: 'text-brand-accent-light',
  },
  {
    token: 'danger',
    cssVar: '--color-danger',
    hex: '#DC3545',
    bgClass: 'bg-danger',
    textClass: 'text-danger',
  },
  {
    token: 'danger-light',
    cssVar: '--color-danger-light',
    hex: '#F8D7DA',
    bgClass: 'bg-danger-light',
    textClass: 'text-danger-light',
  },
  {
    token: 'neutral-light',
    cssVar: '--color-neutral-light',
    hex: '#F7F9FA',
    bgClass: 'bg-neutral-light',
    textClass: 'text-neutral-light',
  },
  {
    token: 'neutral-medium',
    cssVar: '--color-neutral-medium',
    hex: '#D5D8DC',
    bgClass: 'bg-neutral-medium',
    textClass: 'text-neutral-medium',
  },
  {
    token: 'neutral-dark',
    cssVar: '--color-neutral-dark',
    hex: '#2C3E50',
    bgClass: 'bg-neutral-dark',
    textClass: 'text-neutral-dark',
  },
  {
    token: 'admin-sidebar',
    cssVar: '--color-admin-sidebar',
    hex: '#0F2C40',
    bgClass: 'bg-admin-sidebar',
    textClass: 'text-admin-sidebar',
  },
  {
    token: 'admin-sidebar-hover',
    cssVar: '--color-admin-sidebar-hover',
    hex: '#1B4F72',
    bgClass: 'bg-admin-sidebar-hover',
    textClass: 'text-admin-sidebar-hover',
  },
  {
    token: 'admin-bg',
    cssVar: '--color-admin-bg',
    hex: '#F0F4F8',
    bgClass: 'bg-admin-bg',
    textClass: 'text-admin-bg',
  },
  {
    token: 'admin-header',
    cssVar: '--color-admin-header',
    hex: '#FFFFFF',
    bgClass: 'bg-admin-header',
    textClass: 'text-admin-header',
  },
];

@Component({
  selector: 'app-theme-color-cards',
  imports: [NgClass],
  templateUrl: './theme-color-cards.page.html',
  styleUrl: './theme-color-cards.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeColorCardsPage {
  readonly cards: ThemeColorCard[] = THEME_COLORS.flatMap((background) =>
    THEME_COLORS.filter(
      (text) =>
        text.token !== background.token &&
        text.hex.toLowerCase() !== background.hex.toLowerCase(),
    ).map((text) => ({
      id: `${background.token}__${text.token}`,
      background,
      text,
    })),
  );
}
