import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { ThemeContext } from '../../contexts/ThemeContext';

const obterTimestampDataHora = (dataHora) => {
  const [data, hora = '00:00:00'] = dataHora.split(' ');
  const [ano, mes, dia] = data.split('-').map(Number);
  const [horas, minutos, segundos = 0] = hora.split(':').map(Number);
  return new Date(ano, mes - 1, dia, horas, minutos, segundos).getTime();
};

export default function GerenciarAgenda({ route, navigation }) {
  const { theme, showAlert } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const { servico_id, servico_nome } = route.params;
  const [agenda, setAgenda] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalVisivel, setModalVisivel] = useState(false);
  const [dataInput, setDataInput] = useState('');
  const [horaInput, setHoraInput] = useState('');
  const [capacidadeInput, setCapacidadeInput] = useState('1');

  const [modalEdicaoVisivel, setModalEdicaoVisivel] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [capacidadeEdit, setCapacidadeEdit] = useState('');
  const [statusEdit, setStatusEdit] = useState('Disponivel');
  const [statusOriginal, setStatusOriginal] = useState('');

  const [modalAvisoVisivel, setModalAvisoVisivel] = useState(false);

  const [modalPacientesVisivel, setModalPacientesVisivel] = useState(false);
  const [slotSelecionado, setSlotSelecionado] = useState(null);
  const [pacientesSlot, setPacientesSlot] = useState([]);
  const [loadingPacientes, setLoadingPacientes] = useState(false);
  const [agora, setAgora] = useState(0);

  const carregarAgenda = useCallback(async () => {
    try {
      const response = await api.get(`/admin/listar_agenda.php?servico_id=${servico_id}`);
      if (response.data && response.data.sucesso) {
        setAgenda(response.data.agenda);
      } else {
        setAgenda([]);
      }
    } catch (_error) {
      showAlert('Erro', 'Falha ao buscar a agenda.');
    } finally {
      setLoading(false);
    }
  }, [servico_id, showAlert]);

  useEffect(() => {
    const timeoutId = setTimeout(carregarAgenda, 0);
    return () => clearTimeout(timeoutId);
  }, [carregarAgenda]);

  useEffect(() => {
    if (!modalPacientesVisivel) return undefined;

    const atualizarAgora = () => setAgora(new Date().getTime());
    const timeoutId = setTimeout(() => {
      atualizarAgora();
      intervalId = setInterval(atualizarAgora, 10000);
    }, 0);
    let intervalId;

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [modalPacientesVisivel]);

  const mascaraData = (valor) => valor.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{4})\d+?$/, '$1');
  const mascaraHora = (valor) => valor.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1:$2').replace(/(\d{2})\d+?$/, '$1');

  const salvarHorario = async () => {
    const correspondenciaData = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dataInput);
    if (!correspondenciaData) {
      showAlert('Atenção', 'Informe uma data válida no formato DD/MM/AAAA.');
      return;
    }

    const [, diaTexto, mesTexto, anoTexto] = correspondenciaData;
    const dia = Number(diaTexto);
    const mes = Number(mesTexto);
    const ano = Number(anoTexto);
    const dataValidacao = new Date(0);
    dataValidacao.setFullYear(ano, mes - 1, dia);
    dataValidacao.setHours(0, 0, 0, 0);
    if (
      ano < 1
      || dataValidacao.getFullYear() !== ano
      || dataValidacao.getMonth() !== mes - 1
      || dataValidacao.getDate() !== dia
    ) {
      showAlert('Atenção', 'Informe uma data válida no formato DD/MM/AAAA.');
      return;
    }

    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(horaInput)) {
      showAlert('Atenção', 'Informe um horário válido no formato HH:MM (00:00 a 23:59).');
      return;
    }

    const dataHoraFormatada = `${anoTexto}-${mesTexto}-${diaTexto} ${horaInput}:00`;
    const capacidade = Number(capacidadeInput);
    if (!/^\d+$/.test(capacidadeInput) || !Number.isSafeInteger(capacidade) || capacidade <= 0) {
      showAlert('Atenção', 'A capacidade deve ser um número inteiro positivo.');
      return;
    }

    const [horas, minutos] = horaInput.split(':').map(Number);
    const dataHoraLocal = new Date(dataValidacao.getTime());
    dataHoraLocal.setHours(horas, minutos, 0, 0);
    if (dataHoraLocal.getTime() <= Date.now()) {
      showAlert('Atenção', 'O horário deve ser futuro.');
      return;
    }

    try {
      const response = await api.post('/admin/cadastrar_agenda.php', {
        servico_id: servico_id,
        data_hora: dataHoraFormatada,
        capacidade
      });
      if (response.data && response.data.sucesso) {
        showAlert('Sucesso', 'Horário cadastrado!');
        setModalVisivel(false);
        setDataInput('');
        setHoraInput('');
        setCapacidadeInput('1');
        carregarAgenda();
      } else {
        showAlert('Erro', response.data.erro);
      }
    } catch (_error) {
      showAlert('Erro', 'Falha na conexão.');
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
      const response = await api.post('/admin/editar_agenda.php', { id: idEditando, capacidade: parseInt(capacidadeEdit) || 0, status: statusEdit });
      if (response.data && response.data.sucesso) {
        showAlert('Sucesso', 'Horário atualizado!');
        setModalEdicaoVisivel(false);
        carregarAgenda();
      } else {
        showAlert('Erro', response.data.erro);
      }
    } catch (_error) {
      showAlert('Erro', 'Falha na conexão.');
    }
  };

  const salvarEdicao = () => {
    const capacidadeNum = parseInt(capacidadeEdit) || 0;
    if (capacidadeNum < 0) return showAlert('Atenção', 'A capacidade de vagas não pode ser negativa.');
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
    } catch (_error) {
      showAlert('Erro', 'Falha ao buscar pacientes do horário.');
    } finally {
      setLoadingPacientes(false);
    }
  };

  const atualizarPresenca = async (agendamento_id, novoStatus) => {
    try {
      const response = await api.post('/admin/atualizar_presenca.php', { agendamento_id: agendamento_id, status: novoStatus });
      if (response.data && response.data.sucesso) {
        showAlert('Sucesso', novoStatus === 'Faltou' ? 'Falta registrada. A pendência voltou para o paciente reagendar.' : 'Presença confirmada.');
        abrirGestaoPacientes(slotSelecionado);
      } else {
        showAlert('Erro', response.data.erro);
      }
    } catch (_error) {
      showAlert('Erro', 'Falha ao atualizar presença.');
    }
  };

  const formatarExibicao = (dataHoraString) => {
    const [dataParte, horaParte] = dataHoraString.split(' ');
    const [ano, mes, dia] = dataParte.split('-');
    const [hora, minuto] = horaParte.split(':');
    return { data: `${dia}/${mes}/${ano}`, hora: `${hora}:${minuto}` };
  };

  const formatarDataNascimento = (data) => data ? data.split('-').reverse().join('/') : 'Não informada';

  const renderItem = ({ item }) => {
    const statusTexto = item.status ? item.status : 'Esgotado';
    const corStatus = statusTexto === 'Disponivel' ? theme.success : (statusTexto === 'Cancelado' ? theme.danger : theme.textSecondary);
    const { data, hora } = formatarExibicao(item.data_hora);

    return (
      <View style={styles.card}>
        <View style={styles.cardInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={theme.icon} />
            <Text style={styles.dateText}>{data}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color={theme.icon} />
            <Text style={styles.timeText}>{hora}</Text>
          </View>
          <Text style={styles.capacidadeTexto}>Vagas: {item.capacidade}</Text>
        </View>
        <View style={styles.actionGroup}>
          <TouchableOpacity style={styles.btnPacientes} onPress={() => abrirGestaoPacientes(item)}>
            <Ionicons name="people-outline" size={20} color={theme.primary} />
          </TouchableOpacity>
          <View style={[styles.badge, { backgroundColor: corStatus }]}>
            <Text style={styles.badgeText}>{statusTexto}</Text>
          </View>
          <TouchableOpacity style={styles.btnEditar} onPress={() => abrirEdicao(item)}>
            <Ionicons name="pencil" size={18} color={theme.text} />
          </TouchableOpacity>
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
      <View style={styles.headerBox}>
        <Text style={styles.title}>{servico_nome}</Text>
        <Text style={styles.subtitle}>Gerenciamento de Horários</Text>
      </View>

      <FlatList
        data={agenda}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum horário cadastrado.</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisivel(true)}>
        <Ionicons name="add" size={30} color={theme.onAction} />
      </TouchableOpacity>

      <Modal visible={modalVisivel} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Novo Horário</Text>
            
            <Text style={styles.label}>Data (DD/MM/AAAA)</Text>
            <TextInput style={styles.input} value={dataInput} onChangeText={(texto) => setDataInput(mascaraData(texto))} placeholder="Ex: 25/11/2026" placeholderTextColor={theme.textSecondary} keyboardType="numeric" maxLength={10} />

            <Text style={styles.label}>Hora (HH:MM)</Text>
            <TextInput style={styles.input} value={horaInput} onChangeText={(texto) => setHoraInput(mascaraHora(texto))} placeholder="Ex: 14:30" placeholderTextColor={theme.textSecondary} keyboardType="numeric" maxLength={5} />

            <Text style={styles.label}>Capacidade de Vagas</Text>
            <TextInput style={styles.input} value={capacidadeInput} onChangeText={setCapacidadeInput} keyboardType="numeric" />

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

      <Modal visible={modalEdicaoVisivel} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Editar Horário</Text>
            <Text style={styles.label}>Capacidade de Vagas</Text>
            <TextInput style={styles.input} value={capacidadeEdit} onChangeText={setCapacidadeEdit} keyboardType="numeric" />

            <Text style={styles.label}>Status</Text>
            <View style={styles.rowButtons}>
              <TouchableOpacity style={[styles.typeButton, statusEdit === 'Disponivel' && { backgroundColor: theme.successAction, borderColor: theme.success }]} onPress={() => setStatusEdit('Disponivel')}>
                <Text style={[styles.typeButtonText, statusEdit === 'Disponivel' && styles.typeButtonTextActive]}>Disponível</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.typeButton, statusEdit === 'Cancelado' && { backgroundColor: theme.dangerAction, borderColor: theme.danger }]} onPress={() => setStatusEdit('Cancelado')}>
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

      <Modal visible={modalAvisoVisivel} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={[styles.modalTitle, { color: theme.danger, fontSize: 24 }]}>ATENÇÃO</Text>
            <Text style={styles.modalTextWarning}>Tem a certeza que deseja alterar o status para Cancelado?{"\n\n"}Esta ação desmarcará o agendamento de <Text style={{ fontWeight: 'bold' }}>TODOS</Text> os pacientes neste horário.</Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnNaoAviso} onPress={() => { setModalAvisoVisivel(false); setModalEdicaoVisivel(true); }}>
                <Text style={styles.btnTextoBranco}>NÃO</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSimAviso} onPress={confirmarCancelamentoCrítico}>
                <Text style={styles.btnTextoBranco}>SIM, ALTERAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalPacientesVisivel} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { width: '90%', maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>Lista de Atendimento</Text>
            {slotSelecionado && (
              <Text style={styles.subTitleSlot}>
                Horário: {formatarExibicao(slotSelecionado.data_hora).data} às {formatarExibicao(slotSelecionado.data_hora).hora}
              </Text>
            )}
            {slotSelecionado && obterTimestampDataHora(slotSelecionado.data_hora) > agora && (
              <Text style={styles.avisoPresencaPendente}>A presença poderá ser registrada após o horário do atendimento.</Text>
            )}

            {loadingPacientes ? (
              <ActivityIndicator size="large" color={theme.primary} style={{ marginVertical: 30 }} />
            ) : pacientesSlot.length === 0 ? (
              <Text style={styles.emptyTextPacientes}>Nenhum paciente agendado para este horário.</Text>
            ) : (
              <FlatList
                data={pacientesSlot}
                keyExtractor={(item) => item.agendamento_id.toString()}
                renderItem={({ item }) => {
                  const statusCor = item.agendamento_status === 'Concluído' ? theme.success : (item.agendamento_status === 'Faltou' ? '#fd7e14' : theme.primary);
                  const podeRegistrarPresenca = item.agendamento_status === 'Confirmado'
                    && slotSelecionado
                    && obterTimestampDataHora(slotSelecionado.data_hora) <= agora;
                  
                  return (
                    <View style={styles.pacienteCard}>
                      <View style={styles.pacienteInfo}>
                        <Text style={styles.pacienteNome}>{item.paciente_nome}</Text>
                        <Text style={styles.pacienteCpf}>Nascimento: {formatarDataNascimento(item.paciente_data_nascimento)}</Text>
                        <View style={[styles.statusBadgeSmall, { borderColor: statusCor }]}>
                          <Text style={[styles.statusTextSmall, { color: statusCor }]}>{item.agendamento_status}</Text>
                        </View>
                      </View>
                      {item.agendamento_status === 'Confirmado' && (
                        <View style={styles.pacienteActions}>
                          <TouchableOpacity
                            disabled={!podeRegistrarPresenca}
                            style={[styles.btnPresenca, { backgroundColor: theme.successAction, opacity: podeRegistrarPresenca ? 1 : 0.4 }]}
                            onPress={() => atualizarPresenca(item.agendamento_id, 'Concluído')}
                            accessibilityLabel="Marcar comparecimento"
                            accessibilityState={{ disabled: !podeRegistrarPresenca }}
                          >
                            <Ionicons name="checkmark" size={16} color={theme.onAction} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            disabled={!podeRegistrarPresenca}
                            style={[styles.btnPresenca, { backgroundColor: theme.warningAction, marginLeft: 8, opacity: podeRegistrarPresenca ? 1 : 0.4 }]}
                            onPress={() => atualizarPresenca(item.agendamento_id, 'Faltou')}
                            accessibilityLabel="Marcar falta"
                            accessibilityState={{ disabled: !podeRegistrarPresenca }}
                          >
                            <Ionicons name="close" size={16} color={theme.onAction} />
                          </TouchableOpacity>
                        </View>
                      )}
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

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },
  headerBox: { padding: 20, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border, marginBottom: 10 },
  title: { fontSize: 22, fontWeight: 'bold', color: theme.text },
  subtitle: { fontSize: 16, color: theme.textSecondary, marginTop: 4 },
  emptyText: { textAlign: 'center', marginTop: 50, color: theme.textSecondary, fontSize: 16 },
  
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.card, marginHorizontal: 15, marginTop: 10, padding: 15, borderRadius: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 }, borderWidth: 1, borderColor: theme.border },
  cardInfo: { flex: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dateText: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginLeft: 6 },
  timeText: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginLeft: 6 },
  capacidadeTexto: { fontSize: 14, color: theme.textSecondary, marginTop: 6 },
  actionGroup: { flexDirection: 'row', alignItems: 'center' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { color: theme.onStatus, fontWeight: 'bold', fontSize: 12 },
  btnEditar: { marginLeft: 10, padding: 8, backgroundColor: theme.background, borderRadius: 20, borderWidth: 1, borderColor: theme.border },
  btnPacientes: { marginRight: 10, padding: 8, backgroundColor: theme.background, borderRadius: 20, borderWidth: 1, borderColor: theme.border },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: theme.primaryAction, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: theme.card, padding: 20, borderRadius: 10, width: '85%', borderWidth: 1, borderColor: theme.border },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 5, textAlign: 'center' },
  subTitleSlot: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginBottom: 15 },
  avisoPresencaPendente: { fontSize: 13, color: theme.textSecondary, textAlign: 'center', marginBottom: 12 },
  label: { fontSize: 14, color: theme.text, marginBottom: 8, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20, backgroundColor: theme.background, color: theme.text },
  rowButtons: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  typeButton: { flex: 1, padding: 12, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.background, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  typeButtonText: { color: theme.textSecondary, fontWeight: 'bold' },
  typeButtonTextActive: { color: theme.onAction },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  btnCancelar: { flex: 1, padding: 15, backgroundColor: theme.background, borderRadius: 8, alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: theme.border },
  btnCancelarTexto: { color: theme.text, fontWeight: 'bold', fontSize: 16 },
  btnSalvar: { flex: 1, padding: 15, backgroundColor: theme.successAction, borderRadius: 8, alignItems: 'center', marginLeft: 10 },
  btnSalvarTexto: { color: theme.onAction, fontWeight: 'bold', fontSize: 16 },
  
  modalTextWarning: { fontSize: 16, color: theme.text, marginBottom: 25, textAlign: 'center', lineHeight: 22 },
  btnNaoAviso: { flex: 1, padding: 15, backgroundColor: theme.successAction, borderRadius: 8, alignItems: 'center', marginRight: 10 },
  btnSimAviso: { flex: 1, padding: 15, backgroundColor: theme.dangerAction, borderRadius: 8, alignItems: 'center', marginLeft: 10 },
  btnTextoBranco: { color: theme.onAction, fontWeight: 'bold', fontSize: 16 },

  pacienteCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.background, padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: theme.border },
  pacienteInfo: { flex: 1 },
  pacienteNome: { fontSize: 16, fontWeight: 'bold', color: theme.text },
  pacienteCpf: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
  statusBadgeSmall: { alignSelf: 'flex-start', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 5 },
  statusTextSmall: { fontSize: 11, fontWeight: 'bold' },
  pacienteActions: { flexDirection: 'row' },
  btnPresenca: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  btnFecharModal: { backgroundColor: theme.closeAction, padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  btnFecharTexto: { color: theme.onAction, fontWeight: 'bold', fontSize: 15 },
  emptyTextPacientes: { textAlign: 'center', color: theme.textSecondary, marginVertical: 30 }
});
