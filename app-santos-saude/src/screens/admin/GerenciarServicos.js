import React, { useState, useCallback, useContext } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { ThemeContext } from '../../contexts/ThemeContext';

export default function GerenciarServicos({ navigation }) {
  const { theme, showAlert } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('Todos');

  const [modalVisivel, setModalVisivel] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [nomeServico, setNomeServico] = useState('');
  const [tipoServico, setTipoServico] = useState('Consulta');

  const [modalExclusaoVisivel, setModalExclusaoVisivel] = useState(false);
  const [servicoExcluir, setServicoExcluir] = useState({ id: null, nome: '' });

  const carregarServicos = useCallback(async () => {
    try {
      const response = await api.get('/admin/listar_servicos.php');
      if (response.data && response.data.sucesso) {
        setServicos(response.data.servicos);
      } else {
        setServicos([]); 
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

  const abrirModalCadastro = () => {
    setIdEditando(null);
    setNomeServico('');
    setTipoServico('Consulta');
    setModalVisivel(true);
  };

  const abrirModalEdicao = (item) => {
    setIdEditando(item.id);
    setNomeServico(item.nome);
    setTipoServico(item.tipo);
    setModalVisivel(true);
  };

  const salvarServico = async () => {
    if (nomeServico.trim() === '') {
      showAlert('Atenção', 'Digite o nome do serviço.');
      return;
    }

    try {
      const endpoint = idEditando ? '/admin/editar_servico.php' : '/admin/cadastrar_servico.php';
      const payload = idEditando 
        ? { id: idEditando, nome: nomeServico, tipo: tipoServico } 
        : { nome: nomeServico, tipo: tipoServico };

      const response = await api.post(endpoint, payload);

      if (response.data && response.data.sucesso) {
        showAlert('Sucesso', `Serviço ${idEditando ? 'atualizado' : 'cadastrado'} com sucesso!`);
        setModalVisivel(false);
        carregarServicos();
      } else {
        showAlert('Erro', response.data.erro);
      }
    } catch (_error) {
      showAlert('Erro', 'Falha ao conectar com o servidor.');
    }
  };

  const confirmarExclusao = (id, nome) => {
    setServicoExcluir({ id, nome });
    setModalExclusaoVisivel(true);
  };

  const executarExclusao = async () => {
    setModalExclusaoVisivel(false);
    try {
      const response = await api.post('/admin/excluir_servico.php', { id: servicoExcluir.id });
      if (response.data && response.data.sucesso) {
        showAlert('Sucesso', 'Serviço excluído.');
        carregarServicos();
      } else {
        showAlert('Aviso', response.data.erro);
      }
    } catch (_error) {
      showAlert('Erro', 'Falha na conexão.');
    }
  };

  const servicosFiltrados = servicos.filter(servico => {
    const matchBusca = servico.nome.toLowerCase().includes(busca.toLowerCase());
    const matchTipo = filtroTipo === 'Todos' || servico.tipo === filtroTipo;
    return matchBusca && matchTipo;
  });

  const renderItem = ({ item }) => {
    const isConsulta = item.tipo === 'Consulta';
    const icone = isConsulta ? 'medkit-outline' : 'flask-outline';
    const cor = isConsulta ? theme.primary : '#20c997';
    
    const semVagas = !item.vagas_ativas || parseInt(item.vagas_ativas) === 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: cor + '20' }]}>
            <Ionicons name={icone} size={24} color={cor} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.servicoNome}>{item.nome}</Text>
            <Text style={styles.servicoTipo}>{item.tipo}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ffc107' }]} onPress={() => abrirModalEdicao(item)}>
            <Ionicons name="pencil" size={16} color="#000" />
            <Text style={[styles.actionText, { color: '#000' }]}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: semVagas ? '#fd7e14' : theme.primary }]} 
            onPress={() => navigation.navigate('GerenciarAgenda', { servico_id: item.id, servico_nome: item.nome })}
          >
            <Ionicons name={semVagas ? "warning-outline" : "calendar"} size={16} color={theme.onAction} />
            <Text style={styles.actionText}>Agenda</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.dangerAction }]} onPress={() => confirmarExclusao(item.id, item.nome)}>
            <Ionicons name="trash" size={16} color={theme.onAction} />
            <Text style={styles.actionText}>Excluir</Text>
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
      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={theme.icon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Buscar por nome..."
            placeholderTextColor={theme.textSecondary}
            value={busca}
            onChangeText={setBusca}
          />
          {busca !== '' && (
            <TouchableOpacity onPress={() => setBusca('')}>
              <Ionicons name="close-circle" size={20} color={theme.icon} />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.filterTabs}>
          {['Todos', 'Consulta', 'Exame'].map(tipo => (
            <TouchableOpacity 
              key={tipo}
              style={[styles.tabBtn, filtroTipo === tipo && { backgroundColor: theme.primary }]}
              onPress={() => setFiltroTipo(tipo)}
            >
              <Text style={[styles.tabText, filtroTipo === tipo && styles.tabTextActive]}>{tipo}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={servicosFiltrados}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum serviço encontrado.</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={abrirModalCadastro}>
        <Ionicons name="add" size={30} color={theme.onAction} />
      </TouchableOpacity>

      <Modal visible={modalVisivel} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{idEditando ? 'Editar Serviço' : 'Novo Serviço'}</Text>
            
            <Text style={styles.label}>Nome (Ex: Cardiologia, Raio-X)</Text>
            <TextInput
              style={styles.input}
              value={nomeServico}
              onChangeText={setNomeServico}
              placeholder="Digite o nome..."
              placeholderTextColor={theme.textSecondary}
            />

            <Text style={styles.label}>Tipo de Serviço</Text>
            <View style={styles.rowButtons}>
              <TouchableOpacity 
                style={[styles.typeButton, tipoServico === 'Consulta' && { backgroundColor: theme.primaryAction, borderColor: theme.primary }]}
                onPress={() => setTipoServico('Consulta')}
              >
                <Text style={[styles.typeButtonText, tipoServico === 'Consulta' && styles.typeButtonTextActive]}>Consulta</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.typeButton, tipoServico === 'Exame' && { backgroundColor: theme.primaryAction, borderColor: theme.primary }]}
                onPress={() => setTipoServico('Exame')}
              >
                <Text style={[styles.typeButtonText, tipoServico === 'Exame' && styles.typeButtonTextActive]}>Exame</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancelar} onPress={() => setModalVisivel(false)}>
                <Text style={styles.btnCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSalvar} onPress={salvarServico}>
                <Text style={styles.btnSalvarTexto}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalExclusaoVisivel} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Excluir Serviço</Text>
            <Text style={styles.modalText}>
              Tem a certeza que deseja excluir o serviço &quot;{servicoExcluir.nome}&quot;? Esta ação não poderá ser desfeita.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancelarAcao} onPress={() => setModalExclusaoVisivel(false)}>
                <Text style={styles.btnCancelarTextoAcao}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirmarExclusao} onPress={executarExclusao}>
                <Text style={styles.btnTextoBranco}>Sim, Excluir</Text>
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
  emptyText: { textAlign: 'center', marginTop: 50, color: theme.textSecondary, fontSize: 16 },
  
  filterSection: { padding: 15, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 12, borderWidth: 1, borderColor: theme.border },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: theme.text },
  filterTabs: { flexDirection: 'row', justifyContent: 'space-between' },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 20, marginHorizontal: 4, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border },
  tabText: { color: theme.textSecondary, fontWeight: 'bold', fontSize: 13 },
  tabTextActive: { color: theme.onAction },

  card: { backgroundColor: theme.card, marginHorizontal: 15, marginTop: 15, padding: 15, borderRadius: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 }, borderWidth: 1, borderColor: theme.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  iconContainer: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardInfo: { flex: 1 },
  servicoNome: { fontSize: 18, fontWeight: 'bold', color: theme.text },
  servicoTipo: { fontSize: 14, color: theme.textSecondary, marginTop: 2 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 6, flex: 1, marginHorizontal: 3 },
  actionText: { color: theme.onAction, fontWeight: 'bold', marginLeft: 5, fontSize: 13 },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: theme.primaryAction, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: theme.card, padding: 20, borderRadius: 10, width: '85%', borderWidth: 1, borderColor: theme.border },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 15, textAlign: 'center' },
  modalText: { fontSize: 16, color: theme.textSecondary, marginBottom: 25, textAlign: 'center', lineHeight: 22 },
  label: { fontSize: 14, color: theme.text, marginBottom: 8, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20, backgroundColor: theme.background, color: theme.text },
  rowButtons: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  typeButton: { flex: 1, padding: 12, borderWidth: 1, borderColor: theme.border, borderRadius: 8, alignItems: 'center', marginHorizontal: 5, backgroundColor: theme.background },
  typeButtonText: { color: theme.textSecondary, fontWeight: 'bold' },
  typeButtonTextActive: { color: theme.onAction },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  btnCancelar: { flex: 1, padding: 15, backgroundColor: theme.background, borderRadius: 8, alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: theme.border },
  btnCancelarTexto: { color: theme.text, fontWeight: 'bold', fontSize: 16 },
  btnSalvar: { flex: 1, padding: 15, backgroundColor: theme.successAction, borderRadius: 8, alignItems: 'center', marginLeft: 10 },
  btnSalvarTexto: { color: theme.onAction, fontWeight: 'bold', fontSize: 16 },
  btnCancelarAcao: { padding: 12, borderRadius: 8, backgroundColor: theme.background, flex: 1, marginRight: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  btnCancelarTextoAcao: { color: theme.text, fontWeight: 'bold', fontSize: 16 },
  btnConfirmarExclusao: { padding: 12, borderRadius: 8, backgroundColor: theme.dangerAction, flex: 1, marginLeft: 10, alignItems: 'center' },
  btnTextoBranco: { color: theme.onAction, fontWeight: 'bold', fontSize: 16 },
});
