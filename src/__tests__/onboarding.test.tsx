 
import { press, render, typeText } from '@/test-utils/render';

jest.mock('expo-router', () => ({
   
  router: { push: jest.fn(), replace: jest.fn() },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: Object.assign((props: { children?: React.ReactNode }) => props.children ?? null, {}),
  SafeAreaProvider: Object.assign((props: { children?: React.ReactNode }) => props.children ?? null, {}),
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// eslint-disable-next-line import/first
import { router } from 'expo-router';

// eslint-disable-next-line import/first
import OnboardingScreen from '../../app/onboarding/index';

// eslint-disable-next-line import/first
import { clearTempProfile, getTempProfile } from '@/features/profile/temp-profile-store';

const routerMock = router as jest.Mocked<typeof router>;

describe('onboarding akışı', () => {
  beforeEach(() => {
    clearTempProfile();
    routerMock.replace.mockClear();
    routerMock.push.mockClear();
  });

  it('hoş geldin adımından profile geçer', async () => {
    const { getByTestId } = await render(<OnboardingScreen />);
    await press(getByTestId('onboarding-welcome-next'));
    expect(getByTestId('onboarding-name')).toBeOnTheScreen();
    expect(getByTestId('onboarding-birth')).toBeOnTheScreen();
  });

  it('geçersiz doğum tarihinde Devam kapalıdır ve hata gösterilir', async () => {
    const { getByTestId, queryByTestId } = await render(<OnboardingScreen />);
    await press(getByTestId('onboarding-welcome-next'));

    await typeText(getByTestId('onboarding-birth'), '2030-01-01');
    expect(queryByTestId('onboarding-birth-error')).toBeOnTheScreen();

    const next = getByTestId('onboarding-profile-next');
    expect(next.props.accessibilityState.disabled).toBe(true);
  });

  it('geçerli ad ve tarihte profil kaydedilir ve özet gösterilir', async () => {
    const { getByTestId, getByText } = await render(<OnboardingScreen />);
    await press(getByTestId('onboarding-welcome-next'));

    await typeText(getByTestId('onboarding-name'), 'Gökalp');
    await typeText(getByTestId('onboarding-birth'), '20260118');

    const next = getByTestId('onboarding-profile-next');
    expect(next.props.accessibilityState.disabled).toBeFalsy();
    await press(next);

    expect(getByText('Profil: Gökalp · 2026-01-18')).toBeOnTheScreen();
    expect(getTempProfile()).toEqual({ displayName: 'Gökalp', birthDate: '2026-01-18' });
  });

  it('tamamla adımından ana sayfaya döner', async () => {
    const { getByTestId } = await render(<OnboardingScreen />);
    await press(getByTestId('onboarding-welcome-next'));
    await typeText(getByTestId('onboarding-name'), 'Gökalp');
    await typeText(getByTestId('onboarding-birth'), '20260118');
    await press(getByTestId('onboarding-profile-next'));

    await press(getByTestId('onboarding-finish'));
    expect(routerMock.replace).toHaveBeenCalledWith('/(tabs)');
  });
});
