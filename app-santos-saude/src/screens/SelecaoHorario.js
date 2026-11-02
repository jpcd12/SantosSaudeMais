import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import api from '../services/api';

export default function SelecaoHorario({ route, navigation }) {
  const { servico_id, pendencia_id, servico_nome, servico_tipo } = route.params;
  const [horariosAgrupados, setHorariosAgrupados] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [dataExpandida, setDataExpandida] = useState(null);
  
  const [modalProtocolo, setModalProtocolo] = useState(false);
  const [protocoloText, setProtocoloText] = useState('');
  const [modalConfirmacao, setModalConfirmacao] = useState(false);
  const [slotSelecionado, setSlotSelecionado] = useState(null);

  const isConsulta = servico_tipo === 'Consulta';
  const corTema = isConsulta ? '#007BFF' : '#20c997';
  const iconeTema = isConsulta ? 'medkit-outline' : 'flask-outline';

  useEffect(() => {
    carregarHorarios();
  }, []);

  const carregarHorarios = async () => {
    try {
      const response = await api.get(`/paciente/agenda.php?servico_id=${servico_id}`);
      if (response.data && response.data.sucesso) {
        agruparHorarios(response.data.horarios);
      } else {
        Alert.alert('Aviso', response.data.erro || 'Nenhum horário disponível.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao buscar horários.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const agruparHorarios = (lista) => {
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const grupos = {};

    lista.forEach(item => {
      const [dataParte, horaParte] = item.data_hora.split(' ');
      const [ano, mes, dia] = dataParte.split('-');
      
      const dataObj = new Date(Number(ano), Number(mes) - 1, Number(dia));
      const diaSemana = diasSemana[dataObj.getDay()];
      const dataFormatada = `${dia}/${mes}/${ano} (${diaSemana})`;

      if (!grupos[dataFormatada]) {
        grupos[dataFormatada] = [];
      }
      grupos[dataFormatada].push(item);
    });

    const arrayAgrupado = Object.keys(grupos).map(data => ({
      dataDescricao: data,
      horarios: grupos[data]
    }));

    setHorariosAgrupados(arrayAgrupado);
  };

  const abrirModalConfirmacao = (item) => {
    setSlotSelecionado(item);
    setModalConfirmacao(true);
  };

  const confirmarAgendamento = async () => {
    setModalConfirmacao(false);
    
    try {
      const tokenCpf = await AsyncStorage.getItem('userToken');
      const response = await api.post('/paciente/confirmarAgendamento.php', {
        pendencia_id: pendencia_id,
        slot_id: slotSelecionado.slot_id,
        cpf: tokenCpf
      });
      
      if (response.data && response.data.sucesso) {
        const idGerado = response.data.agendamento_id;
        const anoAtual = new Date().getFullYear();
        const protocoloFormatado = `SSM-${anoAtual}-${String(idGerado).padStart(4, '0')}`;
        
        setProtocoloText(protocoloFormatado);
        setModalProtocolo(true);

        const { status } = await Notifications.requestPermissionsAsync();
        
        if (status === 'granted') {
          const [dataParte, horaParte] = slotSelecionado.data_hora.split(' ');
          const [ano, mes, dia] = dataParte.split('-');
          const [hora, minuto, segundo] = horaParte.split(':');
          
          const dataAgendamento = new Date(Number(ano), Number(mes) - 1, Number(dia), Number(hora), Number(minuto), Number(segundo || 0));
          const dataNotificacao = new Date(dataAgendamento.getTime() - (24 * 60 * 60 * 1000));
          const agora = new Date();
          const segundosRestantes = (dataNotificacao.getTime() - agora.getTime()) / 1000;

          const pronome = isConsulta ? 'Sua' : 'Seu';
          const tipoAgendamento = isConsulta ? 'consulta com' : 'exame de';

          if (segundosRestantes > 0) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "⏰ Lembrete de Saúde",
                body: `${pronome} ${tipoAgendamento} ${servico_nome} é amanhã às ${hora}:${minuto}.`,
                sound: true,
              },
              trigger: { 
                type: 'timeInterval', 
                seconds: Math.floor(segundosRestantes), 
                channelId: 'default' 
              },
            });
          }
        }
      } else {
        Alert.alert('Erro', response.data.erro);
      }
    } catch (error) {
      const mensagemErro = error.response?.data?.erro || `Erro Técnico: ${error.message}`;
      Alert.alert('Erro no Servidor', mensagemErro);
      console.error("Detalhes:", error);
    }
  };

  const toggleExpand = (data) => {
    setDataExpandida(dataExpandida === data ? null : data);
  };

  const renderDia = ({ item }) => {
    const isExpanded = dataExpandida === item.dataDescricao;
    
    return (
      <View style={styles.cardContainer}>
        <TouchableOpacity 
          style={styles.diaHeader}
          onPress={() => toggleExpand(item.dataDescricao)}
          activeOpacity={0.7}
        >
          <View style={styles.diaTitleInfo}>
            <Ionicons name="calendar-outline" size={24} color="#007BFF" />
            <Text style={styles.diaTexto}>{item.dataDescricao}</Text>
          </View>
          <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#999" />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.horariosGrid}>
            {item.horarios.map(horario => {
              const horaFormatada = horario.data_hora.split(' ')[1].substring(0, 5);
              return (
                <TouchableOpacity 
                  key={horario.slot_id.toString()} 
                  style={styles.horarioBadge}
                  onPress={() => abrirModalConfirmacao(horario)}
                >
                  <Text style={styles.horarioBadgeText}>{horaFormatada}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
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

  const formatarDataCompleta = (dataHoraString) => {
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const [dataParte, horaParte] = dataHoraString.split(' ');
    const [ano, mes, dia] = dataParte.split('-');
    const dataObj = new Date(Number(ano), Number(mes) - 1, Number(dia));
    const diaSemana = diasSemana[dataObj.getDay()];
    return `${dia}/${mes}/${ano} (${diaSemana})`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerInfo}>
        <View style={styles.serviceHeader}>
          <Ionicons name={iconeTema} size={28} color={corTema} />
          <Text style={styles.title}>{servico_nome}</Text>
        </View>
        <View style={[styles.badgeTipo, { borderColor: corTema, backgroundColor: corTema + '15' }]}>
          <Text style={[styles.badgeTipoText, { color: corTema }]}>{servico_tipo}</Text>
        </View>
      </View>
      
      <Text style={styles.subtitle}>Escolha a melhor data e horário para o seu atendimento:</Text>
      
      {horariosAgrupados.length === 0 ? (
        <Text style={styles.emptyText}>Não há horários disponíveis no momento.</Text>
      ) : (
        <FlatList
          data={horariosAgrupados}
          keyExtractor={(item) => item.dataDescricao}
          renderItem={renderDia}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* Modal de Confirmação Corrigido */}
      <Modal visible={modalConfirmacao} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirmar Agendamento</Text>
            
            <Text style={styles.modalText}>Seu atendimento será agendado para:</Text>
            
            {slotSelecionado && (
              <View style={styles.modalDateBox}>
                <View style={styles.modalDateContent}>
                  <View style={styles.modalDateRow}>
                    <Ionicons name="calendar-outline" size={20} color="#007BFF" />
                    <Text style={styles.modalDateText}>
                      {formatarDataCompleta(slotSelecionado.data_hora)}
                    </Text>
                  </View>
                  <View style={styles.modalDateRow}>
                    <Ionicons name="time-outline" size={20} color="#007BFF" />
                    <Text style={styles.modalDateText}>
                      {slotSelecionado.data_hora.split(' ')[1].substring(0, 5)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.btnCancelarAcao} 
                onPress={() => setModalConfirmacao(false)}
              >
                <Text style={styles.btnTextoBranco}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.btnConfirmarAcao} 
                onPress={confirmarAgendamento}
              >
                <Text style={styles.btnTextoBranco}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Protocolo */}
      <Modal visible={modalProtocolo} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Ionicons name="checkmark-circle" size={70} color="#28a745" style={{ textAlign: 'center', marginBottom: 10 }} />
            <Text style={styles.modalTitle}>Agendamento Confirmado!</Text>
            
            <View style={styles.protocoloBox}>
              <Text style={styles.protocoloLabel}>Seu número de protocolo é:</Text>
              <Text style={styles.protocoloValue}>{protocoloText}</Text>
            </View>

            <TouchableOpacity 
              style={styles.btnOk} 
              onPress={() => {
                setModalProtocolo(false);
                navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
              }}
            >
              <Text style={styles.btnOkText}>Entendi, Voltar ao Início</Text>
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
  
  headerInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  serviceHeader: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginLeft: 10, flexShrink: 1 },
  badgeTipo: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 15, marginLeft: 10 },
  badgeTipoText: { fontSize: 13, fontWeight: 'bold' },
  
  subtitle: { fontSize: 15, color: '#666', marginBottom: 20, lineHeight: 22 },
  
  cardContainer: { backgroundColor: '#fff', borderRadius: 10, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 }, overflow: 'hidden' },
  diaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, backgroundColor: '#fff' },
  diaTitleInfo: { flexDirection: 'row', alignItems: 'center' },
  diaTexto: { fontSize: 16, color: '#333', marginLeft: 12, fontWeight: '600' },
  
  horariosGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, paddingBottom: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 15 },
  horarioBadge: { backgroundColor: '#e9ecef', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, margin: 5, minWidth: 70, alignItems: 'center' },
  horarioBadgeText: { fontSize: 15, fontWeight: 'bold', color: '#007BFF' },
  
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 50 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#fff', padding: 25, borderRadius: 15, width: '85%', elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 15 },
  modalText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 5 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  
  modalDateBox: { backgroundColor: '#f8f9fa', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: '#e9ecef', marginVertical: 15, width: '100%', alignItems: 'center' },
  modalDateContent: { width: 220 },
  modalDateRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  modalDateText: { fontSize: 16, color: '#333', marginLeft: 10, fontWeight: 'bold' },
  
  btnCancelarAcao: { padding: 12, borderRadius: 8, backgroundColor: '#dc3545', flex: 1, marginRight: 10, alignItems: 'center' },
  btnConfirmarAcao: { padding: 12, borderRadius: 8, backgroundColor: '#28a745', flex: 1, marginLeft: 10, alignItems: 'center' },
  btnTextoBranco: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  protocoloBox: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#e9ecef', marginBottom: 25, alignItems: 'center' },
  protocoloLabel: { fontSize: 14, color: '#666', marginBottom: 5 },
  protocoloValue: { fontSize: 24, fontWeight: 'bold', color: '#007BFF', letterSpacing: 1 },
  btnOk: { backgroundColor: '#28a745', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnOkText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});