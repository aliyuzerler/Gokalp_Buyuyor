import { Text } from 'react-native';

import { Button } from '@/components/button';
import { DateField, normalizeDateInput } from '@/components/date-field';
import { EmptyState } from '@/components/empty-state';
import { Input } from '@/components/input';
import { press, render, typeText } from '@/test-utils/render';
import { colors } from '@/theme/tokens';

describe('tasarım sistemi bileşenleri', () => {
  it('Button basıldığında onPress çağrılır', async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<Button label="Kaydet" onPress={onPress} />);
    await press(getByText('Kaydet'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('Button disabled iken basılmaz', async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<Button label="Kaydet" onPress={onPress} disabled />);
    await press(getByText('Kaydet'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('Input hata mesajını gösterir', async () => {
    const { getByText } = await render(
      <Input label="Ad" value="" onChangeText={() => {}} error="Ad boş olamaz." />,
    );
    expect(getByText('Ad boş olamaz.')).toBeOnTheScreen();
  });

  it('EmptyState teşvik edici metin ve aksiyon gösterir', async () => {
    const { getByText } = await render(
      <EmptyState
        title="Henüz kayıt yok"
        description="Bugün bir şey kaydetmek ister misin?"
        action={<Text>CTA</Text>}
      />,
    );
    expect(getByText('Henüz kayıt yok')).toBeOnTheScreen();
    expect(getByText('Bugün bir şey kaydetmek ister misin?')).toBeOnTheScreen();
    expect(getByText('CTA')).toBeOnTheScreen();
  });

  it('DateField rakamları YYYY-MM-DD biçimine çevirir', async () => {
    const onChange = jest.fn();
    const { getByTestId } = await render(
      <DateField value="" onChange={onChange} testID="date-field" />,
    );
    await typeText(getByTestId('date-field'), '20260118');
    expect(onChange).toHaveBeenCalledWith('2026-01-18');
  });

  it('normalizeDateInput serbest girdiyi biçimler', () => {
    expect(normalizeDateInput('2026.01.18')).toBe('2026-01-18');
    expect(normalizeDateInput('abc')).toBe('');
    expect(normalizeDateInput('20260118')).toBe('2026-01-18');
  });

  it('tema paleti kırık beyaz/toprak/adaçayı tonlarını içerir', () => {
    expect(colors.background).toBe('#F7F3EC');
    expect(colors.surfaceMuted).toBe('#EEE7DC');
    expect(colors.sage).toBe('#879681');
    expect(colors.clay).toBe('#C58F78');
  });
});
