import React, { useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { ThemeContext } from '../../contexts/ThemeContext';

export default function PendenciasPaciente({ route, navigation }) {
  const { theme, showAlert } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const { paciente_id, paciente_nome, paciente_dt_nasc } = route.params;
  const [pendencias, setPendencias] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalAvisoVisivel, setModalAvisoVisivel] = useState(false);
  const [modalExclusaoVisivel, setModalExclusaoVisivel] = useState(false);
  const [pendenciaSelecionada, setPendenciaSelecionada] = useState(null);

  const carregarPendencias = useCallback(async () => {
    try {
      const response = await api.get(`/admin/listar_pendencias_paciente.php?paciente_id=${paciente_id}`);
      if (response.data && response.data.sucesso) {
        setPendencias(response.data.pendencias);
      } else {
        setPendencias([]);
      }
    } catch (_error) {
      showAlert('Erro', 'Falha ao buscar pendências.');
    } finally {
      setLoading(false);
    }
  }, [paciente_id, showAlert]);

  useFocusEffect(
    useCallback(() => {
      carregarPendencias();
    }, [carregarPendencias])
  );

  const formatarDataBr = (dataDb) => {
    if (!dataDb) return '';
    const [ano, mes, dia] = dataDb.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const handleExcluirPress = (item) => {
    if (item.status === 'Agendado') {
      setModalAvisoVisivel(true);
    } else {
      setPendenciaSelecionada(item);
      setModalExclusaoVisivel(true);
    }
  };

  const confirmarExclusao = async () => {
    setModalExclusaoVisivel(false);
    try {
      const response = await api.post('/admin/excluir_pendencia_admin.php', { id: pendenciaSelecionada.id });
      if (response.data && response.data.sucesso) {
        carregarPendencias();
      } else {
        showAlert('Erro', response.data.erro);
      }
    } catch (_error) {
      showAlert('Erro', 'Falha ao excluir.');
    }
  };

  const renderItem = ({ item }) => {
    const statusReal = item.status;
    const isAgendado = statusReal === 'Agendado';
    
    let statusExibicao = statusReal || 'Pendente'; 
    let corStatus = theme.textSecondary; 

    if (!statusReal || statusReal === 'Pendente' || statusReal === 'Aguardando') {
      statusExibicao = 'Disponível';
      corStatus = '#ffc107'; 
    } else if (isAgendado) {
      corStatus = theme.success; 
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardInfo}>
          <Text style={styles.servicoNome}>{item.servico_nome}</Text>
          <Text style={styles.servicoTipo}>{item.servico_tipo}</Text>
          <View style={[styles.badge, { backgroundColor: corStatus }]}>
            <Text style={[styles.badgeText, corStatus === '#ffc107' && styles.badgeWarningText]}>{statusExibicao}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.btnLixeira, isAgendado && styles.btnLixeiraDesativada]} 
          onPress={() => handleExcluirPress(item)}
        >
          <Ionicons name="trash" size={24} color={isAgendado ? theme.textSecondary : theme.danger} />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{paciente_nome}</Text>
        <Text style={styles.headerSubtitle}>Data de Nascimento: {formatarDataBr(paciente_dt_nasc)}</Text>
      </View>

      <FlatList
        data={pendencias}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={<Text style={styles.emptyText}>O paciente não possui pendências pendentes.</Text>}
      />

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('AdicionarPendencia', { paciente_id, paciente_nome })}
      >
        <Ionicons name="add" size={30} color={theme.onAction} />
      </TouchableOpacity>

      <Modal visible={modalAvisoVisivel} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Ionicons name="warning-outline" size={50} color="#fd7e14" style={{ alignSelf: 'center', marginBottom: 10 }} />
            <Text style={styles.modalTitle}>Ação Bloqueada</Text>
            <Text style={styles.modalText}>Não é possível remover pendências que já foram agendadas.</Text>
            <TouchableOpacity style={styles.btnOk} onPress={() => setModalAvisoVisivel(false)}>
              <Text style={styles.btnTextoBranco}>ENTENDI</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={modalExclusaoVisivel} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Remover Pendência</Text>
            <Text style={styles.modalText}>Tem a certeza que deseja remover o encaminhamento de &quot;{pendenciaSelecionada?.servico_nome}&quot;?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalExclusaoVisivel(false)}>
                <Text style={styles.btnCancelarTexto}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirmarExclusao} onPress={confirmarExclusao}>
                <Text style={styles.btnTextoBranco}>SIM, REMOVER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },
  header: { padding: 20, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border, marginBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: theme.text },
  headerSubtitle: { fontSize: 14, color: theme.textSecondary, marginTop: 4 },
  emptyText: { textAlign: 'center', marginTop: 40, color: theme.textSecondary, fontSize: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, marginHorizontal: 15, marginBottom: 12, padding: 15, borderRadius: 10, elevation: 2, borderWidth: 1, borderColor: theme.border },
  cardInfo: { flex: 1 },
  servicoNome: { fontSize: 18, fontWeight: 'bold', color: theme.text },
  servicoTipo: { fontSize: 14, color: theme.textSecondary, marginVertical: 4 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 4 },
  badgeText: { color: theme.onStatus, fontWeight: 'bold', fontSize: 12 },
  badgeWarningText: { color: '#252525' },
  btnLixeira: { padding: 10 },
  btnLixeiraDesativada: { opacity: 0.3 },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: theme.primaryAction, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: theme.card, padding: 25, borderRadius: 10, width: '85%', borderWidth: 1, borderColor: theme.border },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 15, textAlign: 'center' },
  modalText: { fontSize: 16, color: theme.textSecondary, marginBottom: 25, textAlign: 'center', lineHeight: 22 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  btnOk: { padding: 12, borderRadius: 8, backgroundColor: theme.primaryAction, alignItems: 'center', width: '100%' },
  btnCancelar: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: theme.background, alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: theme.border },
  btnCancelarTexto: { color: theme.text, fontWeight: 'bold', fontSize: 14 },
  btnConfirmarExclusao: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: theme.dangerAction, alignItems: 'center', marginLeft: 10 },
  btnTextoBranco: { color: theme.onAction, fontWeight: 'bold', fontSize: 14 }
});
