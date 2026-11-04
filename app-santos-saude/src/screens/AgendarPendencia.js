import React, { useState, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { ThemeContext } from '../contexts/ThemeContext';

export default function AgendarPendencia({ navigation }) {
  const { theme, showAlert } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const [pendencias, setPendencias] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregarPendencias = useCallback(async () => {
    try {
      const tokenCpf = await AsyncStorage.getItem('userToken');
      if (!tokenCpf) return;

      const response = await api.get(`/paciente/minhas_pendencias.php?cpf=${tokenCpf}`);
      
      if (response.data && response.data.sucesso) {
        setPendencias(response.data.pendencias);
      } else {
        showAlert('Aviso', response.data.erro || 'Não foi possível carregar os encaminhamentos.');
      }
    } catch (error) {
      showAlert('Erro', 'Falha ao conectar com o servidor.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useFocusEffect(
    useCallback(() => {
      carregarPendencias();
    }, [carregarPendencias])
  );

  const renderItem = ({ item }) => {
    const isConsulta = item.servico_tipo === 'Consulta';
    const corTema = isConsulta ? theme.primary : theme.success;
    const iconeTema = isConsulta ? 'medkit-outline' : 'flask-outline';
    
    const temVaga = item.vagas_disponiveis > 0;
    const corStatus = temVaga ? theme.success : theme.danger;
    const textoStatus = temVaga ? 'Horários disponíveis' : 'Nenhum horário disponível';

    return (
      <TouchableOpacity 
          style={[styles.card, { opacity: temVaga ? 1 : 0.6 }]}
          disabled={!temVaga}
          accessibilityRole="button"
          accessibilityLabel={`${item.servico_nome}, ${item.servico_tipo}. ${textoStatus}`}
          accessibilityHint={temVaga ? 'Abre a escolha de data e horário.' : undefined}
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
        {temVaga && <Ionicons name="chevron-forward-outline" size={20} color={theme.textSecondary} style={styles.arrow} />}
      </TouchableOpacity>
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

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },
  title: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 20 },
  card: { 
    backgroundColor: theme.card, padding: 15, borderRadius: 10, marginBottom: 15,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 },
    justifyContent: 'center', borderWidth: 1, borderColor: theme.border
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  textContainer: { marginLeft: 12, flex: 1 },
  servicoNome: { fontSize: 18, fontWeight: 'bold', color: theme.text },
  servicoTipo: { fontSize: 14, fontWeight: 'bold' },
  status: { fontSize: 13, fontWeight: '500', marginTop: 4 },
  arrow: { position: 'absolute', right: 15 },
  emptyText: { fontSize: 16, color: theme.textSecondary, textAlign: 'center', marginTop: 50 }
});
