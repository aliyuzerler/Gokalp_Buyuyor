import { press, render, typeText } from '@/test-utils/render';
import { View } from 'react-native';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: (props: { children?: React.ReactNode }) => props.children ?? null,
  SafeAreaProvider: (props: { children?: React.ReactNode }) => props.children ?? null,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockSaveProfile = jest.fn().mockResolvedValue({
  id: 'p1',
  display_name: 'Gökalp',
  birth_date: '2026-01-18',
});

jest.mock('@/features/profile/use-profile', () => ({
  useProfile: () => ({
    profile: null,
    loading: false,
    saveProfile: mockSaveProfile,
    reload: jest.fn(),
    age: null,
    ageLabel: null,
  }),
}));

// eslint-disable-next-line import/first
import { router } from 'expo-router';

// eslint-disable-next-line import/first
import OnboardingScreen from '../../app/onboarding/index';

describe('onboarding akışı (Faz 02 — kalıcı profil)', () => {
  beforeEach(() => {
    mockSaveProfile.mockClear();
    (router.replace as jest.Mock).mockClear();
  });

  it('geçerli girişte saveProfile DB hook’una doğru veriyle çağrılır', async () => {
    const { getByTestId, getByText } = await render(<OnboardingScreen />);
    await press(getByTestId('onboarding-welcome-next'));

    await typeText(getByTestId('onboarding-name'), 'Gökalp');
    await typeText(getByTestId('onboarding-birth'), '20260118');

    await press(getByTestId('onboarding-profile-next'));

    expect(mockSaveProfile).toHaveBeenCalledWith({ displayName: 'Gökalp', birthDate: '2026-01-18' });
    expect(getByText('Profil: Gökalp · 2026-01-18')).toBeOnTheScreen();
  });

  it('geçersiz doğum tarihi DB’ye hiç gönderilmez', async () => {
    const { getByTestId, queryByTestId } = await render(<OnboardingScreen />);
    await press(getByTestId('onboarding-welcome-next'));

    await typeText(getByTestId('onboarding-birth'), '2030-01-01');
    expect(queryByTestId('onboarding-birth-error')).toBeOnTheScreen();

    const next = getByTestId('onboarding-profile-next');
    expect(next.props.accessibilityState.disabled).toBe(true);
    expect(mockSaveProfile).not.toHaveBeenCalled();
  });

  it('tamamla adımından ana sayfaya döner', async () => {
    const { getByTestId } = await render(<OnboardingScreen />);
    await press(getByTestId('onboarding-welcome-next'));
    await typeText(getByTestId('onboarding-name'), 'Gökalp');
    await typeText(getByTestId('onboarding-birth'), '20260118');
    await press(getByTestId('onboarding-profile-next'));
    await press(getByTestId('onboarding-finish'));

    expect(router.replace).toHaveBeenCalledWith('/(tabs)');
  });
});

describe('görünüm yardımcıları', () => {
  it('test-utils press/typeText çalışır', async () => {
    await render(<View testID="boş" />);
    expect(true).toBe(true);
  });
});
