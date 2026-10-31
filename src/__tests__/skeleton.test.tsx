import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import * as fs from 'node:fs';
import * as path from 'node:path';

import { ScreenContainer } from '@/components/screen-container';
import { tr } from '@/i18n/tr';
import { colors } from '@/theme/tokens';

describe('Faz 00 — uygulama iskeleti', () => {
  it('merkezi Türkçe metin kaynağı uygulama adını içerir', () => {
    expect(tr.appName).toBe('Gökalp Büyüyor');
    expect(Object.keys(tr.tabs)).toHaveLength(5);
  });

  it('ScreenContainer içeriği ekrana basar', async () => {
    const { getByText } = await render(
      <ScreenContainer>
        <Text>test</Text>
      </ScreenContainer>,
    );
    expect(getByText('test')).toBeOnTheScreen();
  });

  it('tema tokenları UI_UX.md paleti ile uyumlu', () => {
    expect(colors.background).toBe('#F7F3EC');
    expect(colors.primary).toBe('#A77C5C');
    expect(colors.sage).toBe('#879681');
  });

  it('router ekran dosyaları mevcut', () => {
    const tabsDir = path.join(__dirname, '../../app/(tabs)');
    const files = fs.readdirSync(tabsDir);
    for (const expected of [
      '_layout.tsx',
      'index.tsx',
      'journal.tsx',
      'development.tsx',
      'guide.tsx',
      'archive.tsx',
    ]) {
      expect(files).toContain(expected);
    }
  });
});
