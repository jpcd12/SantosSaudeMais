import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function MeusAgendamentos() {
  const [pendencias, setPendencias] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [modalVisivel, setModalVisivel] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);
  
  const [modalProtocolo, setModalProtocolo] = useState(false);
  const [protocoloText, setProtocoloText] = useState('');

  useEffect(() => {
    carregarPendencias();
  }, []);

  const carregarPendencias = async () => {
    try {
      const tokenCpf = await AsyncStorage.getItem('userToken');
      if (!tokenCpf) return;

      const response = await api.get(`/paciente/meus_agendamentos.php?cpf=${tokenCpf}`);
      
      if (response.data && response.data.sucesso) {
        setPendencias(response.data.agendamentos);
      } else {
        Alert.alert('Aviso', response.data.erro || 'Nenhum agendamento encontrado.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao buscar o histórico de agendamentos.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCancelamento = (agendamento_id) => {
    setAgendamentoSelecionado(agendamento_id);
    setModalVisivel(true);
  };

  const confirmarCancelamento = async () => {
    setModalVisivel(false);
    try {
      const response = await api.post('/paciente/cancelarAgendamento.php', { agendamento_id: agendamentoSelecionado });
      
      if (response.data && response.data.sucesso) {
        Alert.alert('Sucesso', 'Compromisso cancelado.');
        carregarPendencias(); 
      }
    } catch (error) {
      const mensagemErro = error.response?.data?.erro || 'Falha ao conectar com o servidor.';
      Alert.alert('Erro', mensagemErro);
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
    const statusColor = item.agendamento_status === 'Confirmado' ? '#28a745' : '#6c757d';
    
    const isConsulta = item.servico_tipo === 'Consulta';
    const corTema = isConsulta ? '#007BFF' : '#20c997';
    const iconeTema = isConsulta ? 'medkit-outline' : 'flask-outline';

    const { data, hora, ano } = formatarDataAgenda(item.data_hora);

    const dataAgendamento = new Date(item.data_hora.replace(' ', 'T'));
    const agora = new Date();
    const diferencaHoras = (dataAgendamento - agora) / (1000 * 60 * 60);
    const podeCancelar = item.agendamento_status === 'Confirmado' && diferencaHoras >= 2;

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.7}
        onPress={() => mostrarProtocolo(item.agendamento_id, ano)}
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
          
          {podeCancelar && (
            <TouchableOpacity 
              style={styles.btnCancelar} 
              onPress={() => abrirModalCancelamento(item.agendamento_id)}
            >
              <Text style={styles.btnCancelarText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
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
      <Text style={styles.pageSubtitle}>Toque em um agendamento para ver o protocolo.</Text>
      
      {pendencias.length === 0 ? (
        <Text style={styles.emptyText}>Você ainda não possui agendamentos confirmados.</Text>
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
              <Text style={{ fontWeight: 'bold' }}>Tem certeza que deseja CANCELAR?</Text>
              {'\n\n'}
              Você poderá reagendá-lo posteriormente.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnVoltar} onPress={() => setModalVisivel(false)}>
                <Text style={styles.btnVoltarText}>Não, Voltar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.btnConfirmarCancelamento} onPress={confirmarCancelamento}>
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
            <Ionicons name="information-circle" size={60} color="#007BFF" style={{ textAlign: 'center', marginBottom: 10 }} />
            <Text style={styles.modalTitle}>Detalhes do Agendamento</Text>
            
            <View style={styles.protocoloBox}>
              <Text style={styles.protocoloLabel}>Seu número de protocolo é:</Text>
              <Text style={styles.protocoloValue}>{protocoloText}</Text>
            </View>

            <TouchableOpacity style={styles.btnOkProtocolo} onPress={() => setModalProtocolo(false)}>
              <Text style={styles.btnOkProtocoloText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageSubtitle: { fontSize: 14, color: '#666', marginBottom: 15, textAlign: 'center' },
  
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 } },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  textContainer: { marginLeft: 12, flex: 1 },
  servicoNome: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  servicoTipo: { fontSize: 13, fontWeight: 'bold', marginTop: 2 },
  
  dateTimeContainer: { backgroundColor: '#f8f9fa', padding: 10, borderRadius: 8, marginBottom: 15 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  infoText: { fontSize: 15, color: '#444', marginLeft: 10, fontWeight: '500' },
  
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1 },
  statusText: { fontSize: 14, fontWeight: 'bold' },
  btnCancelar: { backgroundColor: '#dc3545', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 5 },
  btnCancelarText: { color: '#fff', fontWeight: 'bold' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '85%', elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10, textAlign: 'center' },
  modalText: { fontSize: 15, color: '#666', marginBottom: 20, lineHeight: 22, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  btnVoltar: { padding: 12, borderRadius: 8, backgroundColor: '#f0f0f0', flex: 1, marginRight: 10, alignItems: 'center' },
  btnVoltarText: { color: '#333', fontWeight: 'bold' },
  btnConfirmarCancelamento: { padding: 12, borderRadius: 8, backgroundColor: '#dc3545', flex: 1, alignItems: 'center' },
  btnConfirmarText: { color: '#fff', fontWeight: 'bold' },
  
  protocoloBox: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#e9ecef', marginBottom: 20, alignItems: 'center' },
  protocoloLabel: { fontSize: 14, color: '#666', marginBottom: 5 },
  protocoloValue: { fontSize: 22, fontWeight: 'bold', color: '#007BFF', letterSpacing: 1 },
  btnOkProtocolo: { backgroundColor: '#007BFF', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnOkProtocoloText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 50 }
});