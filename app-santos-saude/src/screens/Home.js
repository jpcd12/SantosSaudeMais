import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function Home({ navigation }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [nomePaciente, setNomePaciente] = useState('');
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginRight: 15 }}>
          <Ionicons name="menu" size={30} color="#333" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

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
        <ActivityIndicator size="large" color="#007BFF" />
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
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AgendarPendencia')}>
          <Ionicons name="calendar-outline" size={40} color="#007BFF" />
          <Text style={styles.cardText}>Agendar Pendências</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('MeusAgendamentos')}>
          <Ionicons name="list-outline" size={40} color="#007BFF" />
          <Text style={styles.cardText}>Meus Agendamentos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Historico')}>
          <Ionicons name="document-text-outline" size={40} color="#007BFF" />
          <Text style={styles.cardText}>Histórico</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('MeuPerfil')}>
          <Ionicons name="person-outline" size={40} color="#007BFF" />
          <Text style={styles.cardText}>Meu Perfil</Text>
        </TouchableOpacity>
      </View>
      
      <Modal visible={menuVisible} transparent={true} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdown}>
                <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={20} color="#dc3545" style={{ marginRight: 10 }} />
                  <Text style={styles.menuText}>Sair</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, justifyContent: 'space-between' },
  card: { 
    backgroundColor: '#fff', width: '47%', padding: 20, marginVertical: 10, 
    borderRadius: 10, alignItems: 'center', elevation: 3, 
    shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 } 
  },
  cardText: { marginTop: 10, fontSize: 14, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' },
  dropdown: { 
    position: 'absolute', top: 60, right: 15, backgroundColor: '#fff', 
    borderRadius: 8, padding: 10, elevation: 5, minWidth: 120
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10 },
  menuText: { fontSize: 16, color: '#dc3545', fontWeight: 'bold' }
});