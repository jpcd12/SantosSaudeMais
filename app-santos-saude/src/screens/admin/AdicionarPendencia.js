import React, { useState, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { ThemeContext } from '../../contexts/ThemeContext';

export default function AdicionarPendencia({ route, navigation }) {
  const { theme, showAlert } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const { paciente_id, paciente_nome } = route.params;
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('Consulta');
  
  const [modalVisivel, setModalVisivel] = useState(false);
  const [modalDuplicadaVisivel, setModalDuplicadaVisivel] = useState(false);
  const [servicoSelecionado, setServicoSelecionado] = useState(null);

  const carregarServicos = useCallback(async () => {
    try {
      const response = await api.get('/admin/listar_servicos.php');
      if (response.data && response.data.sucesso) {
        setServicos(response.data.servicos);
      }
    } catch (_error) {
      showAlert('Erro', 'Falha ao buscar os serviços.');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useFocusEffect(
    useCallback(() => {
      carregarServicos();
    }, [carregarServicos])
  );

  const confirmarAdicao = async () => {
    setModalVisivel(false);
    try {
      const response = await api.post('/admin/adicionar_pendencia.php', {
        paciente_id: paciente_id,
        servico_id: servicoSelecionado.id
      });

      if (response.data && response.data.sucesso) {
        showAlert('Sucesso', 'Pendência adicionada ao paciente.');
        navigation.goBack();
      } else if (response.data && response.data.duplicada) {
        setModalDuplicadaVisivel(true);
      } else {
        showAlert('Erro', response.data.erro);
      }
    } catch (_error) {
      showAlert('Erro', 'Falha na conexão.');
    }
  };

  const servicosFiltrados = servicos.filter(s => 
    s.tipo === filtroTipo && s.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const renderItem = ({ item }) => {
    const isConsulta = item.tipo === 'Consulta';
    const icone = isConsulta ? 'medkit-outline' : 'flask-outline';
    const cor = isConsulta ? theme.primary : '#20c997';

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => { setServicoSelecionado(item); setModalVisivel(true); }}
      >
        <View style={[styles.iconContainer, { backgroundColor: cor + '20' }]}>
          <Ionicons name={icone} size={24} color={cor} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.servicoNome}>{item.nome}</Text>
          <Text style={styles.servicoTipo}>{item.tipo}</Text>
        </View>
        <Ionicons name="add-circle" size={28} color={theme.success} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nova Pendência</Text>
        <Text style={styles.headerSubtitle}>Paciente: {paciente_nome}</Text>
      </View>

      <View style={styles.filterSection}>
        <View style={styles.filterTabs}>
          {['Consulta', 'Exame'].map(tipo => (
            <TouchableOpacity 
              key={tipo}
              style={[styles.tabBtn, filtroTipo === tipo && { backgroundColor: theme.primaryAction }]}
              onPress={() => setFiltroTipo(tipo)}
            >
              <Text style={[styles.tabText, filtroTipo === tipo && styles.tabTextActive]}>{tipo}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={theme.icon} />
          <TextInput 
            style={styles.searchInput}
            placeholder={`Buscar ${filtroTipo.toLowerCase()}...`}
            placeholderTextColor={theme.textSecondary}
            value={busca}
            onChangeText={setBusca}
          />
        </View>
      </View>

      <FlatList
        data={servicosFiltrados}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum serviço encontrado.</Text>}
      />

      <Modal visible={modalVisivel} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Adicionar Pendência</Text>
            <Text style={styles.modalText}>
              Deseja adicionar o encaminhamento para <Text style={{fontWeight: 'bold', color: theme.text}}>{servicoSelecionado?.nome}</Text> ao paciente {paciente_nome}?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalVisivel(false)}>
                <Text style={styles.btnCancelarTexto}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSalvar} onPress={confirmarAdicao}>
                <Text style={styles.btnTextoBranco}>CONFIRMAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalDuplicadaVisivel} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Ionicons name="alert-circle-outline" size={50} color={theme.danger} style={{ alignSelf: 'center', marginBottom: 10 }} />
            <Text style={styles.modalTitle}>Pendência Já Existente</Text>
            <Text style={styles.modalText}>
              O paciente <Text style={{fontWeight: 'bold', color: theme.text}}>{paciente_nome}</Text> já possui uma pendência ativa para o serviço <Text style={{fontWeight: 'bold', color: theme.text}}>{servicoSelecionado?.nome}</Text>.
            </Text>
            <TouchableOpacity style={styles.btnOk} onPress={() => setModalDuplicadaVisivel(false)}>
              <Text style={styles.btnTextoBranco}>ENTENDI</Text>
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
  header: { padding: 20, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text },
  headerSubtitle: { fontSize: 14, color: theme.textSecondary, marginTop: 4 },
  
  filterSection: { padding: 15, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border, marginBottom: 10 },
  filterTabs: { flexDirection: 'row', marginBottom: 12 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, marginHorizontal: 4, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border },
  tabText: { color: theme.textSecondary, fontWeight: 'bold', fontSize: 14 },
  tabTextActive: { color: theme.onAction },
  
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: theme.border },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: theme.text },
  
  emptyText: { textAlign: 'center', marginTop: 40, color: theme.textSecondary, fontSize: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, marginHorizontal: 15, marginBottom: 10, padding: 15, borderRadius: 10, elevation: 2, borderWidth: 1, borderColor: theme.border },
  iconContainer: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardInfo: { flex: 1 },
  servicoNome: { fontSize: 16, fontWeight: 'bold', color: theme.text },
  servicoTipo: { fontSize: 14, color: theme.textSecondary, marginTop: 2 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: theme.card, padding: 25, borderRadius: 10, width: '85%', borderWidth: 1, borderColor: theme.border },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 15, textAlign: 'center' },
  modalText: { fontSize: 16, color: theme.textSecondary, marginBottom: 25, textAlign: 'center', lineHeight: 22 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  btnCancelar: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: theme.background, alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: theme.border },
  btnCancelarTexto: { color: theme.text, fontWeight: 'bold', fontSize: 14 },
  btnSalvar: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: theme.successAction, alignItems: 'center', marginLeft: 10 },
  btnOk: { padding: 12, borderRadius: 8, backgroundColor: theme.primaryAction, alignItems: 'center', width: '100%' },
  btnTextoBranco: { color: theme.onAction, fontWeight: 'bold', fontSize: 14 }
});
