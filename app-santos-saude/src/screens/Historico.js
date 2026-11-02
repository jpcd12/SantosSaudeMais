import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function Historico() {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarHistorico();
  }, []);

  const carregarHistorico = async () => {
    try {
      const tokenCpf = await AsyncStorage.getItem('userToken');
      if (!tokenCpf) return;

      const response = await api.get(`/paciente/historico.php?cpf=${tokenCpf}`);
      
      if (response.data && response.data.sucesso) {
        setHistorico(response.data.historico);
      } else {
        Alert.alert('Aviso', response.data.erro || 'Nenhum histórico encontrado.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao buscar o histórico.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatarDataAgenda = (dataHoraString) => {
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const [dataParte, horaParte] = dataHoraString.split(' ');
    const [ano, mes, dia] = dataParte.split('-');
    const [hora, minuto] = horaParte.split(':');
    
    const dataObj = new Date(Number(ano), Number(mes) - 1, Number(dia));
    const diaSemana = diasSemana[dataObj.getDay()];
    
    return {
      data: `${dia}/${mes}/${ano} (${diaSemana})`,
      hora: `${hora}:${minuto}`
    };
  };

  const renderItem = ({ item }) => {
    let statusColor = '#6c757d'; 
    if (item.agendamento_status === 'Cancelado') statusColor = '#dc3545'; 
    if (item.agendamento_status === 'Concluído') statusColor = '#28a745'; 
    if (item.agendamento_status === 'Faltou') statusColor = '#fd7e14'; 

    const isConsulta = item.servico_tipo === 'Consulta';
    const corTema = isConsulta ? '#007BFF' : '#20c997';
    const iconeTema = isConsulta ? 'medkit-outline' : 'flask-outline';

    const { data, hora } = formatarDataAgenda(item.data_hora);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: corTema + '20' }]}>
            <Ionicons name={iconeTema} size={24} color={corTema} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.servicoNome}>{item.servico_nome}</Text>
            <Text style={[styles.servicoTipo, { color: corTema }]}>{item.servico_tipo}</Text>
          </View>
        </View>
        
        <View style={styles.dateTimeContainer}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color="#666" />
            <Text style={styles.infoText}>{data}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color="#666" />
            <Text style={styles.infoText}>{hora}</Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <View style={[styles.statusBadge, { borderColor: statusColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.agendamento_status}</Text>
          </View>
        </View>
      </View>
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
      {historico.length === 0 ? (
        <Text style={styles.emptyText}>Seu histórico de agendamentos está vazio.</Text>
      ) : (
        <FlatList
          data={historico}
          keyExtractor={(item) => item.agendamento_id.toString()}
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
  
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 } },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  textContainer: { marginLeft: 12, flex: 1 },
  servicoNome: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  servicoTipo: { fontSize: 13, fontWeight: 'bold', marginTop: 2 },
  
  dateTimeContainer: { backgroundColor: '#f8f9fa', padding: 10, borderRadius: 8, marginBottom: 15 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  infoText: { fontSize: 15, color: '#444', marginLeft: 10, fontWeight: '500' },
  
  footerRow: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' },
  statusBadge: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1 },
  statusText: { fontSize: 14, fontWeight: 'bold' },
  
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 50 }
});