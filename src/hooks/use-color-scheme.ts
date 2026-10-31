import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Uygulama sabit sıcak/krem tema kullanır; koyu tema MVP kapsamı dışındadır.
 * Hook API'si gelecekteki tema desteği için korunur.
 */
export function useColorScheme(): 'light' {
  // react-native hook'u web/native farkını soyutlar; sabit açık temayı döndürüyoruz.
  void useRNColorScheme();
  return 'light';
}
