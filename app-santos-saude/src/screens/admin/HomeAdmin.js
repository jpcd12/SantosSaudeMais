import React, { useState, useLayoutEffect, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function HomeAdmin({ navigation }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [adminNome, setAdminNome] = useState('');

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
    
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const primeiroNome = adminNome ? adminNome.split(' ')[0] : 'Admin';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Olá, {primeiroNome}!</Text>
        <Text style={styles.subtitle}>Selecione um módulo para gerenciar:</Text>
      </View>

      <View style={styles.listContainer}>
        <TouchableOpacity 
          style={styles.card} 
          onPress={() => navigation.navigate('GerenciarServicos')}
        >
          <Ionicons name="medkit-outline" size={28} color="#007BFF" />
          <Text style={styles.cardText}>Gerenciar Serviços</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card} 
          onPress={() => navigation.navigate('ControlePendencias')}
        >
          <Ionicons name="document-text-outline" size={28} color="#28a745" />
          <Text style={styles.cardText}>Controle de Pendências</Text>
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
  header: { padding: 20, paddingTop: 30, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 5 },
  listContainer: { paddingHorizontal: 20 },
  card: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 20, 
    marginBottom: 15, 
    borderRadius: 8, 
    alignItems: 'center', 
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 1,
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowOffset: { width: 0, height: 1 } 
  },
  cardText: { fontSize: 16, fontWeight: 'bold', color: '#333', marginLeft: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' },
  dropdown: { 
    position: 'absolute', top: 60, right: 15, backgroundColor: '#fff', 
    borderRadius: 8, padding: 10, elevation: 5, minWidth: 120
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10 },
  menuText: { fontSize: 16, color: '#dc3545', fontWeight: 'bold' }
});