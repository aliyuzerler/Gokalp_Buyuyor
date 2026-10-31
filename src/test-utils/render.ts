/**
 * RNTL v14 + React 19 yardımcıları.
 * render() async; fireEvent çağrıları act içine alınmalı.
 */
import { act, fireEvent, render } from '@testing-library/react-native';

export async function renderAsync(ui: React.ReactElement): Promise<Awaited<ReturnType<typeof render>>> {
  return (await render(ui)) as unknown as Awaited<ReturnType<typeof render>>;
}

export { renderAsync as render };

/** Pressable/TouchableOpacity için async press. */
export async function press(element: Parameters<typeof fireEvent.press>[0]) {
  await act(async () => {
    fireEvent.press(element);
  });
}

/** TextInput için async changeText. */
export async function typeText(
  element: Parameters<typeof fireEvent.changeText>[0],
  text: string,
) {
  await act(async () => {
    fireEvent.changeText(element, text);
  });
}

export { fireEvent };
