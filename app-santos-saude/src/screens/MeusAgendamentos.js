import React, { useState, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { ThemeContext } from '../contexts/ThemeContext';

export default function MeusAgendamentos() {
  const { theme, showAlert } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const [pendencias, setPendencias] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modalVisivel, setModalVisivel] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);
  
  const [modalProtocolo, setModalProtocolo] = useState(false);
  const [protocoloText, setProtocoloText] = useState('');

  const carregarPendencias = useCallback(async () => {
    try {
      const tokenCpf = await AsyncStorage.getItem('userToken');
      if (!tokenCpf) return;

      const response = await api.get(`/paciente/meus_agendamentos.php?cpf=${tokenCpf}`);
      
      if (response.data && response.data.sucesso) {
        setPendencias(response.data.agendamentos);
      } else {
        showAlert('Aviso', response.data.erro || 'Nenhum agendamento encontrado.');
      }
    } catch (error) {
      showAlert('Erro', 'Falha ao buscar o histórico de agendamentos.');
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

  const abrirModalCancelamento = (agendamento_id) => {
    setAgendamentoSelecionado(agendamento_id);
    setModalVisivel(true);
  };

  const confirmarCancelamento = async () => {
    setModalVisivel(false);
    try {
      const response = await api.post('/paciente/cancelarAgendamento.php', { agendamento_id: agendamentoSelecionado });
      
      if (response.data && response.data.sucesso) {
        showAlert('Sucesso', 'Compromisso cancelado.');
        carregarPendencias(); 
      }
    } catch (error) {
      const mensagemErro = error.response?.data?.erro || 'Falha ao conectar com o servidor.';
      showAlert('Erro', mensagemErro);
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
      hora: `${hora}:${minuto}`,
      ano: ano
    };
  };

  const mostrarProtocolo = (agendamento_id, ano) => {
    const protocoloFormatado = `SSM-${ano}-${String(agendamento_id).padStart(4, '0')}`;
    setProtocoloText(protocoloFormatado);
    setModalProtocolo(true);
  };

  const renderItem = ({ item }) => {
    const statusColor = item.agendamento_status === 'Confirmado' ? theme.success : theme.textSecondary;
    
    const isConsulta = item.servico_tipo === 'Consulta';
    const corTema = isConsulta ? theme.primary : theme.success;
    const iconeTema = isConsulta ? 'medkit-outline' : 'flask-outline';

    const { data, hora, ano } = formatarDataAgenda(item.data_hora);

    const dataAgendamento = new Date(item.data_hora.replace(' ', 'T'));
    const agora = new Date();
    const diferencaHoras = (dataAgendamento - agora) / (1000 * 60 * 60);
    const podeCancelar = item.agendamento_status === 'Confirmado' && diferencaHoras >= 2;

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

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.btnProtocolo}
              accessibilityRole="button"
              accessibilityLabel={`Ver protocolo de ${item.servico_nome}, em ${data}`}
              onPress={() => mostrarProtocolo(item.agendamento_id, ano)}
            >
              <Text style={styles.btnProtocoloText}>Ver protocolo</Text>
            </TouchableOpacity>
            {podeCancelar && (
              <TouchableOpacity
                style={styles.btnCancelar}
                accessibilityRole="button"
                accessibilityLabel={`Cancelar ${item.servico_nome}, em ${data}`}
                onPress={() => abrirModalCancelamento(item.agendamento_id)}
              >
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
            )}
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
      
      {pendencias.length === 0 ? (
        <Text style={styles.emptyText}>Ainda não possui agendamentos confirmados.</Text>
      ) : (
        <FlatList
          data={pendencias}
          keyExtractor={(item) => item.agendamento_id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* Modal de Cancelamento */}
      <Modal visible={modalVisivel} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Cancelar Compromisso</Text>
            
            <Text style={styles.modalText}>
              <Text style={{ fontWeight: 'bold' }}>Tem a certeza que deseja CANCELAR?</Text>
              {'\n\n'}
              Poderá reagendá-lo posteriormente.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnVoltar} onPress={() => setModalVisivel(false)} accessibilityRole="button">
                <Text style={styles.btnVoltarText}>Não, Voltar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.btnConfirmarCancelamento} onPress={confirmarCancelamento} accessibilityRole="button">
                <Text style={styles.btnConfirmarText}>Sim, Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Exibição do Protocolo */}
      <Modal visible={modalProtocolo} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Ionicons name="information-circle" size={60} color={theme.primary} style={{ textAlign: 'center', marginBottom: 10 }} />
            <Text style={styles.modalTitle}>Detalhes do Agendamento</Text>
            
            <View style={styles.protocoloBox}>
              <Text style={styles.protocoloLabel}>O seu número de protocolo é:</Text>
              <Text style={styles.protocoloValue}>{protocoloText}</Text>
            </View>

            <TouchableOpacity style={styles.btnOkProtocolo} onPress={() => setModalProtocolo(false)} accessibilityRole="button">
              <Text style={styles.btnOkProtocoloText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },
  pageSubtitle: { fontSize: 14, color: theme.textSecondary, marginBottom: 15, textAlign: 'center' },
  
  card: { backgroundColor: theme.card, padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 }, borderWidth: 1, borderColor: theme.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  textContainer: { marginLeft: 12, flex: 1 },
  servicoNome: { fontSize: 18, fontWeight: 'bold', color: theme.text },
  servicoTipo: { fontSize: 13, fontWeight: 'bold', marginTop: 2 },
  
  dateTimeContainer: { backgroundColor: theme.background, padding: 10, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: theme.border },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  infoText: { fontSize: 15, color: theme.text, marginLeft: 10, fontWeight: '500' },
  
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1 },
  statusText: { fontSize: 14, fontWeight: 'bold' },
  btnProtocolo: { backgroundColor: theme.primaryAction, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 5 },
  btnProtocoloText: { color: theme.onAction, fontWeight: 'bold' },
  btnCancelar: { backgroundColor: theme.dangerAction, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 5 },
  btnCancelarText: { color: theme.onAction, fontWeight: 'bold' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: theme.card, padding: 20, borderRadius: 10, width: '85%', elevation: 5, borderWidth: 1, borderColor: theme.border },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 10, textAlign: 'center' },
  modalText: { fontSize: 15, color: theme.textSecondary, marginBottom: 20, lineHeight: 22, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  btnVoltar: { padding: 12, borderRadius: 8, backgroundColor: theme.background, flex: 1, marginRight: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  btnVoltarText: { color: theme.text, fontWeight: 'bold' },
  btnConfirmarCancelamento: { padding: 12, borderRadius: 8, backgroundColor: theme.dangerAction, flex: 1, alignItems: 'center' },
  btnConfirmarText: { color: theme.onAction, fontWeight: 'bold' },
  
  protocoloBox: { backgroundColor: theme.background, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: theme.border, marginBottom: 20, alignItems: 'center' },
  protocoloLabel: { fontSize: 14, color: theme.textSecondary, marginBottom: 5 },
  protocoloValue: { fontSize: 22, fontWeight: 'bold', color: theme.primary, letterSpacing: 1 },
  btnOkProtocolo: { backgroundColor: theme.primaryAction, padding: 12, borderRadius: 8, alignItems: 'center' },
  btnOkProtocoloText: { color: theme.onAction, fontWeight: 'bold', fontSize: 16 },
  
  emptyText: { fontSize: 16, color: theme.textSecondary, textAlign: 'center', marginTop: 50 }
});
