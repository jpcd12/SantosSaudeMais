import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { Colors } from '@/constants/colors';

type ThemePreference = 'light' | 'dark' | null;
type AppTheme = typeof Colors.light | typeof Colors.dark;
type AlertButton = { text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' };
type AlertData = { title: string; message?: string; buttons?: AlertButton[] } | null;

type ThemeContextValue = {
  isDark: boolean;
  isReady: boolean;
  theme: AppTheme;
  toggleTheme: () => void;
  showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);
let globalAlertHandler: ThemeContextValue['showAlert'] | null = null;

export function showGlobalAlert(title: string, message?: string, buttons?: AlertButton[]) {
  globalAlertHandler?.(title, message, buttons);
}

export function ThemeProvider({ children }: React.PropsWithChildren) {
  const systemColorScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>(null);
  const [isReady, setIsReady] = useState(false);
  const [alert, setAlert] = useState<AlertData>(null);
  const persistenceQueue = useRef<Promise<void>>(Promise.resolve());
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    AsyncStorage.getItem('appTheme')
      .then((savedTheme) => {
        const savedPreference: ThemePreference = savedTheme === 'dark' || savedTheme === 'light'
          ? savedTheme
          : null;
        if (isMounted.current) setPreference(savedPreference);
      })
      .catch((error) => console.error('Erro ao carregar tema', error))
      .finally(() => {
        if (isMounted.current) setIsReady(true);
      });

    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady || preference === null) return;

    persistenceQueue.current = persistenceQueue.current
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem('appTheme', preference));
    persistenceQueue.current.catch((error) => console.error('Erro ao salvar tema', error));
  }, [isReady, preference]);

  const isDark = (preference ?? systemColorScheme) === 'dark';

  const toggleTheme = useCallback(() => {
    setPreference((currentPreference) => {
      const currentlyDark = (currentPreference ?? systemColorScheme) === 'dark';
      return currentlyDark ? 'light' : 'dark';
    });
  }, [systemColorScheme]);

  const showAlert = useCallback((title: string, message?: string, buttons?: AlertButton[]) => {
    setAlert({ title, message, buttons });
  }, []);

  useEffect(() => {
    globalAlertHandler = showAlert;
    return () => {
      if (globalAlertHandler === showAlert) globalAlertHandler = null;
    };
  }, [showAlert]);

  const value = useMemo<ThemeContextValue>(() => ({
    isDark,
    isReady,
    theme: isDark ? Colors.dark : Colors.light,
    toggleTheme,
    showAlert,
  }), [isDark, isReady, showAlert, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
      <Modal visible={alert !== null} transparent animationType="fade" onRequestClose={() => setAlert(null)}>
        <View style={alertStyles.backdrop}>
          <View style={[alertStyles.dialog, { backgroundColor: value.theme.card, borderColor: value.theme.border }]} accessibilityRole="alert">
            {alert && (
              <>
                <Text style={[alertStyles.title, { color: value.theme.text }]}>{alert.title}</Text>
                {alert.message ? <Text style={[alertStyles.message, { color: value.theme.text }]}>{alert.message}</Text> : null}
                <View style={alertStyles.actions}>
                  {(alert.buttons?.length ? alert.buttons : [{ text: 'OK' }]).map((button, index) => (
                    <Pressable
                      key={`${button.text}-${index}`}
                      accessibilityRole="button"
                      onPress={() => {
                        setAlert(null);
                        button.onPress?.();
                      }}
                      style={({ pressed }) => [alertStyles.action, pressed && alertStyles.pressed]}
                    >
                      <Text style={[alertStyles.actionText, { color: value.theme.primary }]}>{button.text}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ThemeContext.Provider>
  );
}

const alertStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 440, borderWidth: 1, borderRadius: 16, padding: 24, elevation: 8, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 10 },
  message: { fontSize: 16, lineHeight: 23 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: 20, marginHorizontal: -8, marginBottom: -8 },
  action: { minWidth: 64, minHeight: 44, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, borderRadius: 8 },
  pressed: { opacity: 0.65 },
  actionText: { fontSize: 15, fontWeight: '700' },
});

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppTheme deve ser usado dentro de ThemeProvider.');
  return context;
}
