import React, { useState, useLayoutEffect, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../contexts/ThemeContext';

export default function HomeAdmin({ navigation }) {
  const { theme, isDark, toggleTheme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const [menuVisible, setMenuVisible] = useState(false);
  const [adminNome, setAdminNome] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginRight: 15 }}>
          <Ionicons name="menu" size={30} color={theme.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme]);

  useEffect(() => {
    const carregarDados = async () => {
      const nome = await AsyncStorage.getItem('adminNome');
      if (nome) setAdminNome(nome);
    };
    carregarDados();
  }, []);

  const handleLogout = async () => {
    setMenuVisible(false);
    await AsyncStorage.removeItem('adminToken');
    await AsyncStorage.removeItem('adminNome');
    
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const primeiroNome = adminNome ? adminNome.split(' ')[0] : 'Admin';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Olá, {primeiroNome}!</Text>
        <Text style={styles.subtitle}>Selecione um módulo para gerenciar:</Text>
      </View>

      <View style={styles.listContainer}>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('GerenciarServicos')}>
          <Ionicons name="medkit-outline" size={28} color={theme.primary} />
          <Text style={styles.cardText}>Gerenciar Serviços</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ControlePendencias')}>
          <Ionicons name="document-text-outline" size={28} color={theme.success} />
          <Text style={styles.cardText}>Controle de Pendências</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={menuVisible} transparent={true} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdown}>
                
                <View style={styles.menuItem}>
                  <Ionicons name={isDark ? "moon" : "sunny"} size={20} color={theme.text} style={{ marginRight: 10 }} />
                  <Text style={[styles.menuText, { color: theme.text, flex: 1 }]}>Modo Escuro</Text>
                  <Switch value={isDark} onValueChange={toggleTheme} />
                </View>

                <View style={styles.menuDivider} />

                <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={20} color={theme.danger} style={{ marginRight: 10 }} />
                  <Text style={[styles.menuText, { color: theme.danger }]}>Sair</Text>
                </TouchableOpacity>

              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { padding: 20, paddingTop: 30, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.text },
  subtitle: { fontSize: 16, color: theme.textSecondary, marginTop: 5 },
  listContainer: { paddingHorizontal: 20 },
  card: { 
    flexDirection: 'row', backgroundColor: theme.card, padding: 20, marginBottom: 15, 
    borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: theme.border,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 1 } 
  },
  cardText: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginLeft: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  dropdown: { 
    position: 'absolute', top: 60, right: 15, backgroundColor: theme.card, 
    borderRadius: 8, padding: 10, elevation: 5, minWidth: 200, borderWidth: 1, borderColor: theme.border
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10 },
  menuDivider: { height: 1, backgroundColor: theme.border, marginVertical: 5 },
  menuText: { fontSize: 16, fontWeight: 'bold' }
});
