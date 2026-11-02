import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function AgendarPendencia({ navigation }) {
  const [pendencias, setPendencias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarPendencias();
  }, []);

  const carregarPendencias = async () => {
    try {
      const tokenCpf = await AsyncStorage.getItem('userToken');
      if (!tokenCpf) return;

      const response = await api.get(`/paciente/minhas_pendencias.php?cpf=${tokenCpf}`);
      
      if (response.data && response.data.sucesso) {
        setPendencias(response.data.pendencias);
      } else {
        Alert.alert('Aviso', response.data.erro || 'Não foi possível carregar os encaminhamentos.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao conectar com o servidor.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const isConsulta = item.servico_tipo === 'Consulta';
    const corTema = isConsulta ? '#007BFF' : '#20c997';
    const iconeTema = isConsulta ? 'medkit-outline' : 'flask-outline';
    
    const temVaga = item.vagas_disponiveis > 0;
    const corStatus = temVaga ? '#28a745' : '#dc3545';
    const textoStatus = temVaga ? 'Horários disponíveis' : 'Nenhum horário disponível';

    return (
      <TouchableOpacity 
          style={[styles.card, { opacity: temVaga ? 1 : 0.6 }]}
          disabled={!temVaga}
          onPress={() => {
            navigation.navigate('SelecaoHorario', { 
              servico_id: item.servico_id, 
              pendencia_id: item.pendencia_id,
              servico_nome: item.servico_nome,
              servico_tipo: item.servico_tipo 
            });
          }}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: corTema + '20' }]}>
            <Ionicons name={iconeTema} size={24} color={corTema} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.servicoNome}>{item.servico_nome}</Text>
            <Text style={[styles.servicoTipo, { color: corTema }]}>{item.servico_tipo}</Text>
          </View>
        </View>
        <Text style={[styles.status, { color: corStatus }]}>{textoStatus}</Text>
        {temVaga && <Ionicons name="chevron-forward-outline" size={20} color="#999" style={styles.arrow} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>O que você deseja agendar hoje?</Text>
      {pendencias.length === 0 ? (
        <Text style={styles.emptyText}>Você não possui encaminhamentos pendentes.</Text>
      ) : (
        <FlatList
          data={pendencias}
          keyExtractor={(item) => item.pendencia_id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  card: { 
    backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 },
    justifyContent: 'center'
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  textContainer: { marginLeft: 12, flex: 1 },
  servicoNome: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  servicoTipo: { fontSize: 14, fontWeight: 'bold' },
  status: { fontSize: 13, fontWeight: '500', marginTop: 4 },
  arrow: { position: 'absolute', right: 15 },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 50 }
});