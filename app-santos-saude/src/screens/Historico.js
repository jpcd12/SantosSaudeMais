import React, { useState, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { ThemeContext } from '../contexts/ThemeContext';

export default function Historico() {
  const { theme, showAlert } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregarHistorico = useCallback(async () => {
    try {
      const tokenCpf = await AsyncStorage.getItem('userToken');
      if (!tokenCpf) return;

      const response = await api.get(`/paciente/historico.php?cpf=${tokenCpf}`);
      
      if (response.data && response.data.sucesso) {
        setHistorico(response.data.historico);
      } else {
        showAlert('Aviso', response.data.erro || 'Nenhum histórico encontrado.');
      }
    } catch (error) {
      showAlert('Erro', 'Falha ao buscar o histórico.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useFocusEffect(
    useCallback(() => {
      carregarHistorico();
    }, [carregarHistorico])
  );

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
    let statusColor = theme.textSecondary; 
    if (item.agendamento_status === 'Cancelado') statusColor = theme.danger; 
    if (item.agendamento_status === 'Concluído') statusColor = theme.success; 
    if (item.agendamento_status === 'Faltou') statusColor = theme.warningText;

    const isConsulta = item.servico_tipo === 'Consulta';
    const corTema = isConsulta ? theme.primary : theme.success;
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
            <Ionicons name="calendar-outline" size={18} color={theme.icon} />
            <Text style={styles.infoText}>{data}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color={theme.icon} />
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
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {historico.length === 0 ? (
        <Text style={styles.emptyText}>O seu histórico de agendamentos está vazio.</Text>
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

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },
  
  card: { backgroundColor: theme.card, padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 }, borderWidth: 1, borderColor: theme.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  textContainer: { marginLeft: 12, flex: 1 },
  servicoNome: { fontSize: 18, fontWeight: 'bold', color: theme.text },
  servicoTipo: { fontSize: 13, fontWeight: 'bold', marginTop: 2 },
  
  dateTimeContainer: { backgroundColor: theme.background, padding: 10, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: theme.border },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  infoText: { fontSize: 15, color: theme.text, marginLeft: 10, fontWeight: '500' },
  
  footerRow: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' },
  statusBadge: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1 },
  statusText: { fontSize: 14, fontWeight: 'bold' },
  
  emptyText: { fontSize: 16, color: theme.textSecondary, textAlign: 'center', marginTop: 50 }
});
