import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function GerenciarAgenda({ route, navigation }) {
  const { servico_id, servico_nome } = route.params;
  const [agenda, setAgenda] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados do Modal de Cadastro
  const [modalVisivel, setModalVisivel] = useState(false);
  const [dataInput, setDataInput] = useState('');
  const [horaInput, setHoraInput] = useState('');
  const [capacidadeInput, setCapacidadeInput] = useState('1');

  // Estados do Modal de Edição
  const [modalEdicaoVisivel, setModalEdicaoVisivel] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [capacidadeEdit, setCapacidadeEdit] = useState('');
  const [statusEdit, setStatusEdit] = useState('Disponivel');
  const [statusOriginal, setStatusOriginal] = useState('');

  // Estados do Modal de Aviso (Cancelamento)
  const [modalAvisoVisivel, setModalAvisoVisivel] = useState(false);

  // Estados do Modal de Gestão de Presenças
  const [modalPacientesVisivel, setModalPacientesVisivel] = useState(false);
  const [slotSelecionado, setSlotSelecionado] = useState(null);
  const [pacientesSlot, setPacientesSlot] = useState([]);
  const [loadingPacientes, setLoadingPacientes] = useState(false);

  useEffect(() => {
    carregarAgenda();
  }, []);

  const carregarAgenda = async () => {
    try {
      const response = await api.get(`/admin/listar_agenda.php?servico_id=${servico_id}`);
      if (response.data && response.data.sucesso) {
        setAgenda(response.data.agenda);
      } else {
        setAgenda([]);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao buscar a agenda.');
    } finally {
      setLoading(false);
    }
  };

  const mascaraData = (valor) => {
    return valor.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{4})\d+?$/, '$1');
  };

  const mascaraHora = (valor) => {
    return valor.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1:$2').replace(/(\d{2})\d+?$/, '$1');
  };

  const salvarHorario = async () => {
    if (dataInput.length !== 10 || horaInput.length !== 5) {
      Alert.alert('Atenção', 'Preencha a data e a hora nos formatos corretos.');
      return;
    }

    const [dia, mes, ano] = dataInput.split('/');
    const dataHoraFormatada = `${ano}-${mes}-${dia} ${horaInput}:00`;

    try {
      const response = await api.post('/admin/cadastrar_agenda.php', {
        servico_id: servico_id,
        data_hora: dataHoraFormatada,
        capacidade: parseInt(capacidadeInput) || 1
      });

      if (response.data && response.data.sucesso) {
        Alert.alert('Sucesso', 'Horário cadastrado!');
        setModalVisivel(false);
        setDataInput('');
        setHoraInput('');
        setCapacidadeInput('1');
        carregarAgenda();
      } else {
        Alert.alert('Erro', response.data.erro);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na conexão.');
    }
  };

  const abrirEdicao = (item) => {
    setIdEditando(item.id);
    setCapacidadeEdit(item.capacidade.toString());
    const statusAtual = item.status || 'Esgotado';
    setStatusEdit(statusAtual);
    setStatusOriginal(statusAtual);
    setModalEdicaoVisivel(true);
  };

  const executarEdicaoAPI = async () => {
    try {
      const response = await api.post('/admin/editar_agenda.php', {
        id: idEditando,
        capacidade: parseInt(capacidadeEdit) || 0,
        status: statusEdit
      });

      if (response.data && response.data.sucesso) {
        Alert.alert('Sucesso', 'Horário atualizado!');
        setModalEdicaoVisivel(false);
        carregarAgenda();
      } else {
        Alert.alert('Erro', response.data.erro);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na conexão.');
    }
  };

  const salvarEdicao = () => {
    const capacidadeNum = parseInt(capacidadeEdit) || 0;
    
    if (capacidadeNum < 0) {
      Alert.alert('Atenção', 'A capacidade de vagas não pode ser negativa.');
      return;
    }

    if (statusEdit === 'Cancelado' && statusOriginal !== 'Cancelado') {
      setModalEdicaoVisivel(false);
      setModalAvisoVisivel(true);
    } else {
      executarEdicaoAPI();
    }
  };

  const confirmarCancelamentoCrítico = () => {
    setModalAvisoVisivel(false);
    executarEdicaoAPI();
  };

  const abrirGestaoPacientes = async (slot) => {
    setSlotSelecionado(slot);
    setModalPacientesVisivel(true);
    setLoadingPacientes(true);
    try {
      const response = await api.get(`/admin/listar_pacientes_slot.php?slot_id=${slot.id}`);
      if (response.data && response.data.sucesso) {
        setPacientesSlot(response.data.pacientes);
      } else {
        setPacientesSlot([]);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao buscar pacientes do horário.');
    } finally {
      setLoadingPacientes(false);
    }
  };

  const atualizarPresenca = async (agendamento_id, novoStatus) => {
    try {
      const response = await api.post('/admin/atualizar_presenca.php', {
        agendamento_id: agendamento_id,
        status: novoStatus
      });

      if (response.data && response.data.sucesso) {
        Alert.alert('Sucesso', novoStatus === 'Faltou' ? 'Falta registrada. A pendência voltou para o paciente reagendar.' : 'Presença confirmada.');
        abrirGestaoPacientes(slotSelecionado);
      } else {
        Alert.alert('Erro', response.data.erro);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar presença.');
    }
  };

  const formatarExibicao = (dataHoraString) => {
    const [dataParte, horaParte] = dataHoraString.split(' ');
    const [ano, mes, dia] = dataParte.split('-');
    const [hora, minuto] = horaParte.split(':');
    return {
      data: `${dia}/${mes}/${ano}`,
      hora: `${hora}:${minuto}`
    };
  };

  const formatarCPF = (cpf) => {
    if (!cpf) return '';
    return cpf.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const renderItem = ({ item }) => {
    const statusTexto = item.status ? item.status : 'Esgotado';
    const corStatus = statusTexto === 'Disponivel' ? '#28a745' : (statusTexto === 'Cancelado' ? '#dc3545' : '#6c757d');
    const { data, hora } = formatarExibicao(item.data_hora);

    return (
      <View style={styles.card}>
        <View style={styles.cardInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#333" />
            <Text style={styles.dateText}>{data}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#333" />
            <Text style={styles.timeText}>{hora}</Text>
          </View>
          <Text style={styles.capacidadeTexto}>Vagas: {item.capacidade}</Text>
        </View>
        <View style={styles.actionGroup}>
          <TouchableOpacity style={styles.btnPacientes} onPress={() => abrirGestaoPacientes(item)}>
            <Ionicons name="people-outline" size={20} color="#007BFF" />
          </TouchableOpacity>
          <View style={[styles.badge, { backgroundColor: corStatus }]}>
            <Text style={styles.badgeText}>{statusTexto}</Text>
          </View>
          <TouchableOpacity style={styles.btnEditar} onPress={() => abrirEdicao(item)}>
            <Ionicons name="pencil" size={18} color="#666" />
          </TouchableOpacity>
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
      <View style={styles.headerBox}>
        <Text style={styles.title}>{servico_nome}</Text>
        <Text style={styles.subtitle}>Gerenciamento de Horários</Text>
      </View>

      <FlatList
        data={agenda}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum horário futuro cadastrado.</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisivel(true)}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Modal de Cadastro */}
      <Modal visible={modalVisivel} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Novo Horário</Text>
            
            <Text style={styles.label}>Data (DD/MM/AAAA)</Text>
            <TextInput
              style={styles.input}
              value={dataInput}
              onChangeText={(texto) => setDataInput(mascaraData(texto))}
              placeholder="Ex: 25/11/2026"
              keyboardType="numeric"
              maxLength={10}
            />

            <Text style={styles.label}>Hora (HH:MM)</Text>
            <TextInput
              style={styles.input}
              value={horaInput}
              onChangeText={(texto) => setHoraInput(mascaraHora(texto))}
              placeholder="Ex: 14:30"
              keyboardType="numeric"
              maxLength={5}
            />

            <Text style={styles.label}>Capacidade de Vagas</Text>
            <TextInput
              style={styles.input}
              value={capacidadeInput}
              onChangeText={setCapacidadeInput}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalVisivel(false)}>
                <Text style={styles.btnCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSalvar} onPress={salvarHorario}>
                <Text style={styles.btnSalvarTexto}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Edição */}
      <Modal visible={modalEdicaoVisivel} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Editar Horário</Text>

            <Text style={styles.label}>Capacidade de Vagas</Text>
            <TextInput
              style={styles.input}
              value={capacidadeEdit}
              onChangeText={setCapacidadeEdit}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Status</Text>
            <View style={styles.rowButtons}>
              <TouchableOpacity 
                style={[
                  styles.typeButton, 
                  statusEdit === 'Disponivel' && { backgroundColor: '#28a745', borderColor: '#28a745' }
                ]}
                onPress={() => setStatusEdit('Disponivel')}
              >
                <Text style={[styles.typeButtonText, statusEdit === 'Disponivel' && styles.typeButtonTextActive]}>Disponível</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.typeButton, 
                  statusEdit === 'Cancelado' && { backgroundColor: '#dc3545', borderColor: '#dc3545' }
                ]}
                onPress={() => setStatusEdit('Cancelado')}
              >
                <Text style={[styles.typeButtonText, statusEdit === 'Cancelado' && styles.typeButtonTextActive]}>Cancelado</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalEdicaoVisivel(false)}>
                <Text style={styles.btnCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSalvar} onPress={salvarEdicao}>
                <Text style={styles.btnSalvarTexto}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Aviso de Cancelamento */}
      <Modal visible={modalAvisoVisivel} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={[styles.modalTitle, { color: '#dc3545', fontSize: 24 }]}>ATENÇÃO</Text>
            
            <Text style={styles.modalTextWarning}>
              Tem certeza que você quer alterar o status para Cancelado?
              {"\n\n"}
              Essa ação desmarcará o agendamento de <Text style={{ fontWeight: 'bold' }}>TODOS</Text> os pacientes nesse horário.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.btnNaoAviso} 
                onPress={() => {
                  setModalAvisoVisivel(false);
                  setModalEdicaoVisivel(true);
                }}
              >
                <Text style={styles.btnTextoBranco}>NÃO</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.btnSimAviso} 
                onPress={confirmarCancelamentoCrítico}
              >
                <Text style={styles.btnTextoBranco}>SIM, QUERO ALTERAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Gestão de Presenças e Pacientes */}
      <Modal visible={modalPacientesVisivel} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { width: '90%', maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>Lista de Atendimento</Text>
            {slotSelecionado && (
              <Text style={styles.subTitleSlot}>
                Horário: {formatarExibicao(slotSelecionado.data_hora).data} às {formatarExibicao(slotSelecionado.data_hora).hora}
              </Text>
            )}

            {loadingPacientes ? (
              <ActivityIndicator size="large" color="#007BFF" style={{ marginVertical: 30 }} />
            ) : pacientesSlot.length === 0 ? (
              <Text style={styles.emptyTextPacientes}>Nenhum paciente agendado para este horário.</Text>
            ) : (
              <FlatList
                data={pacientesSlot}
                keyExtractor={(item) => item.agendamento_id.toString()}
                renderItem={({ item }) => {
                  const statusCor = item.agendamento_status === 'Concluído' ? '#28a745' : (item.agendamento_status === 'Faltou' ? '#fd7e14' : '#007BFF');
                  
                  return (
                    <View style={styles.pacienteCard}>
                      <View style={styles.pacienteInfo}>
                        <Text style={styles.pacienteNome}>{item.paciente_nome}</Text>
                        <Text style={styles.pacienteCpf}>CPF: {formatarCPF(item.paciente_cpf)}</Text>
                        <View style={[styles.statusBadgeSmall, { borderColor: statusCor }]}>
                          <Text style={[styles.statusTextSmall, { color: statusCor }]}>{item.agendamento_status}</Text>
                        </View>
                      </View>

                      <View style={styles.pacienteActions}>
                        <TouchableOpacity 
                          style={[styles.btnPresenca, { backgroundColor: '#28a745' }]} 
                          onPress={() => atualizarPresenca(item.agendamento_id, 'Concluído')}
                        >
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={[styles.btnPresenca, { backgroundColor: '#fd7e14', marginLeft: 8 }]} 
                          onPress={() => atualizarPresenca(item.agendamento_id, 'Faltou')}
                        >
                          <Ionicons name="close" size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }}
                contentContainerStyle={{ paddingVertical: 10 }}
              />
            )}

            <TouchableOpacity style={styles.btnFecharModal} onPress={() => setModalPacientesVisivel(false)}>
              <Text style={styles.btnFecharTexto}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBox: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd', marginBottom: 10 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 4 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#666', fontSize: 16 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 15, marginTop: 10, padding: 15, borderRadius: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 } },
  cardInfo: { flex: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dateText: { fontSize: 16, fontWeight: 'bold', color: '#333', marginLeft: 6 },
  timeText: { fontSize: 16, fontWeight: 'bold', color: '#333', marginLeft: 6 },
  capacidadeTexto: { fontSize: 14, color: '#666', marginTop: 6 },
  actionGroup: { flexDirection: 'row', alignItems: 'center' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  btnEditar: { marginLeft: 10, padding: 8, backgroundColor: '#f0f0f0', borderRadius: 20 },
  btnPacientes: { marginRight: 10, padding: 8, backgroundColor: '#e7f3ff', borderRadius: 20 },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#007BFF', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  
  // Modais
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '85%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 5, textAlign: 'center' },
  subTitleSlot: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 15 },
  label: { fontSize: 14, color: '#333', marginBottom: 8, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20, backgroundColor: '#f9f9f9' },
  rowButtons: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  typeButton: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  typeButtonText: { color: '#666', fontWeight: 'bold' },
  typeButtonTextActive: { color: '#fff' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  btnCancelar: { flex: 1, padding: 15, backgroundColor: '#f0f0f0', borderRadius: 8, alignItems: 'center', marginRight: 10 },
  btnCancelarTexto: { color: '#333', fontWeight: 'bold', fontSize: 16 },
  btnSalvar: { flex: 1, padding: 15, backgroundColor: '#28a745', borderRadius: 8, alignItems: 'center', marginLeft: 10 },
  btnSalvarTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  // Estilos de Aviso
  modalTextWarning: { fontSize: 16, color: '#333', marginBottom: 25, textAlign: 'center', lineHeight: 22 },
  btnNaoAviso: { flex: 1, padding: 15, backgroundColor: '#28a745', borderRadius: 8, alignItems: 'center', marginRight: 10 },
  btnSimAviso: { flex: 1, padding: 15, backgroundColor: '#dc3545', borderRadius: 8, alignItems: 'center', marginLeft: 10 },
  btnTextoBranco: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // Estilos Lista Pacientes Modal
  pacienteCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  pacienteInfo: { flex: 1 },
  pacienteNome: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  pacienteCpf: { fontSize: 13, color: '#666', marginTop: 2 },
  statusBadgeSmall: { alignSelf: 'flex-start', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 5 },
  statusTextSmall: { fontSize: 11, fontWeight: 'bold' },
  pacienteActions: { flexDirection: 'row' },
  btnPresenca: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  btnFecharModal: { backgroundColor: '#6c757d', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  btnFecharTexto: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  emptyTextPacientes: { textAlign: 'center', color: '#666', marginVertical: 30 }
});