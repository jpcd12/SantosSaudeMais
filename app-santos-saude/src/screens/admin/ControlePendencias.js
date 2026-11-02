import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';

export default function ControlePendencias({ navigation }) {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  useFocusEffect(
    useCallback(() => {
      carregarPacientes();
    }, [])
  );

  const carregarPacientes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/listar_pacientes.php');
      if (response.data && response.data.sucesso) {
        setPacientes(response.data.pacientes);
      } else {
        setPacientes([]);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao buscar pacientes.');
    } finally {
      setLoading(false);
    }
  };

  const formatarDataBr = (dataDb) => {
    if (!dataDb) return '';
    const [ano, mes, dia] = dataDb.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const pacientesFiltrados = pacientes.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase()) || 
    formatarDataBr(p.dt_nasc).includes(busca)
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('PendenciasPaciente', { 
        paciente_id: item.id, 
        paciente_nome: item.nome,
        paciente_dt_nasc: item.dt_nasc
      })}
    >
      <View style={styles.cardHeader}>
        <Ionicons name="person-circle-outline" size={40} color="#007BFF" />
        <View style={styles.headerText}>
          <Text style={styles.pacienteNome}>{item.nome}</Text>
          <Text style={styles.pacienteInfo}>{formatarDataBr(item.dt_nasc)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  if (loading && pacientes.length === 0) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#007BFF" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput 
          style={styles.searchInput}
          placeholder="Buscar por nome ou data (DD/MM/AAAA)..."
          value={busca}
          onChangeText={setBusca}
        />
        {busca !== '' && (
          <TouchableOpacity onPress={() => setBusca('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={pacientesFiltrados}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum paciente encontrado.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 15, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10, elevation: 2 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: '#333' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#666', fontSize: 16 },
  card: { backgroundColor: '#fff', marginHorizontal: 15, marginBottom: 12, padding: 15, borderRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  headerText: { marginLeft: 12, flex: 1 },
  pacienteNome: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  pacienteInfo: { fontSize: 14, color: '#666', marginTop: 2 },
});