import { writable } from 'svelte/store';
import { Animations, Density, TextSize, TextWeight } from '../../ui/enums';
import { Storage } from '../../ui/services';
import type { BaseSettings } from '../../ui/models';
import { themes } from '../themes';

const defaultSettings: BaseSettings = {
  // Onyx
  themeId: themes[2].id,
  textSize: TextSize.Medium,
  textWeight: TextWeight.Medium,
  displayDensity: Density.Normal,
  borderRadius: 0,
  animationSpeed: Animations.Normal,
  showHelpText: true,
  enableShortcutKeys: true,
  shortcutKeyLocation: 'left',
  shortcutKeyColor: 'accent',
  contextMenuIndicators: true,
  accentColorH: themes[2].values.accentColorH,
  accentColorS: themes[2].values.accentColorS,
  accentColorL: themes[2].values.accentColorL,
  cardColorH: themes[2].values.cardColorH,
  cardColorS: themes[2].values.cardColorS,
  cardColorL: themes[2].values.cardColorL,
  textColorH: themes[2].values.textColorH,
  textColorS: themes[2].values.textColorS,
  textColorL: themes[2].values.textColorL,
  focusColorA: themes[2].values.focusColorA,
  dividerColorA: themes[2].values.dividerColorA,
  toasterLocation: 'bottom',
  toasterDuration: 3000,
};

const storedSettings = Storage.get<BaseSettings>('settings');

function createSettings() {
  const { subscribe, update } = writable<BaseSettings>({
    ...defaultSettings,
    ...storedSettings,
  });

  subscribe((val) => {
    Storage.set('settings', val);
  });

  return {
    subscribe,
    update: function (data: Partial<BaseSettings>) {
      update((previous) => ({ ...previous, ...data }));
    },
    updateOne: function <T extends keyof BaseSettings>(key: T, value: BaseSettings[T]) {
      update((previous) => ({ ...previous, [key]: value }));
    },
  };
}

export const settings = createSettings();
