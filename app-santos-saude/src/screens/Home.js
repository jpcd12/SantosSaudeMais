import React, { useState, useEffect, useLayoutEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback, ActivityIndicator, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { ThemeContext } from '../contexts/ThemeContext';

export default function Home({ navigation }) {
  const { theme, isDark, toggleTheme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const [menuVisible, setMenuVisible] = useState(false);
  const [nomePaciente, setNomePaciente] = useState('');
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginRight: 15, padding: 8 }} accessibilityRole="button" accessibilityLabel="Abrir menu de opções">
          <Ionicons name="menu" size={30} color={theme.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme]);

  useEffect(() => {
    const carregarPerfil = async () => {
      try {
        const tokenCpf = await AsyncStorage.getItem('userToken');
        if (tokenCpf) {
          const response = await api.get(`/paciente/perfil.php?cpf=${tokenCpf}`);
          if (response.data && response.data.sucesso) {
            setNomePaciente(response.data.perfil.nome);
          }
        }
      } catch (error) {
        console.error('Erro na API:', error.message);
      } finally {
        setLoading(false);
      }
    };
    carregarPerfil();
  }, []);

  const handleLogout = async () => {
    setMenuVisible(false);
    await AsyncStorage.removeItem('userToken');
    navigation.replace('Login');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const primeiroNome = nomePaciente ? nomePaciente.split(' ')[0] : 'Paciente';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Olá, {primeiroNome}!</Text>
        <Text style={styles.subtitle}>O que deseja fazer hoje?</Text>
      </View>

      <View style={styles.grid}>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AgendarPendencia')} accessibilityRole="button" accessibilityLabel="Agendar pendências">
          <Ionicons name="calendar-outline" size={40} color={theme.primary} />
          <Text style={styles.cardText}>Agendar Pendências</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('MeusAgendamentos')} accessibilityRole="button" accessibilityLabel="Ver meus agendamentos">
          <Ionicons name="list-outline" size={40} color={theme.primary} />
          <Text style={styles.cardText}>Meus Agendamentos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Historico')} accessibilityRole="button" accessibilityLabel="Ver histórico de agendamentos">
          <Ionicons name="document-text-outline" size={40} color={theme.primary} />
          <Text style={styles.cardText}>Histórico</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('MeuPerfil')} accessibilityRole="button" accessibilityLabel="Abrir meu perfil">
          <Ionicons name="person-outline" size={40} color={theme.primary} />
          <Text style={styles.cardText}>Meu Perfil</Text>
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
                  <Switch value={isDark} onValueChange={toggleTheme} accessibilityRole="switch" accessibilityLabel="Modo escuro" accessibilityState={{ checked: isDark }} />
                </View>

                <View style={styles.menuDivider} />

                <TouchableOpacity style={styles.menuItem} onPress={handleLogout} accessibilityRole="button" accessibilityLabel="Sair da conta">
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },
  header: { padding: 20, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border },
  title: { fontSize: 26, fontWeight: 'bold', color: theme.text },
  subtitle: { fontSize: 16, color: theme.textSecondary, marginTop: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, justifyContent: 'space-between' },
  card: { 
    backgroundColor: theme.card, width: '47%', padding: 20, marginVertical: 10, 
    borderRadius: 10, alignItems: 'center', elevation: 3, 
    shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 },
    borderWidth: 1, borderColor: theme.border
  },
  cardText: { marginTop: 10, fontSize: 14, fontWeight: 'bold', color: theme.text, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  dropdown: { 
    position: 'absolute', top: 60, right: 15, backgroundColor: theme.card, 
    borderRadius: 8, padding: 10, elevation: 5, minWidth: 200, borderWidth: 1, borderColor: theme.border
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10 },
  menuDivider: { height: 1, backgroundColor: theme.border, marginVertical: 5 },
  menuText: { fontSize: 16, fontWeight: 'bold' }
});
