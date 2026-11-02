import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function GerenciarServicos({ navigation }) {
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de Filtro e Busca
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('Todos');

  // Estados dos Modais
  const [modalVisivel, setModalVisivel] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [nomeServico, setNomeServico] = useState('');
  const [tipoServico, setTipoServico] = useState('Consulta');

  const [modalExclusaoVisivel, setModalExclusaoVisivel] = useState(false);
  const [servicoExcluir, setServicoExcluir] = useState({ id: null, nome: '' });

  useFocusEffect(
    useCallback(() => {
      carregarServicos();
    }, [])
  );

  const carregarServicos = async () => {
    try {
      const response = await api.get('/admin/listar_servicos.php');
      if (response.data && response.data.sucesso) {
        setServicos(response.data.servicos);
      } else {
        setServicos([]); 
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao buscar os serviços.');
    } finally {
      setLoading(false);
    }
  };

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
      Alert.alert('Atenção', 'Digite o nome do serviço.');
      return;
    }

    try {
      const endpoint = idEditando ? '/admin/editar_servico.php' : '/admin/cadastrar_servico.php';
      const payload = idEditando 
        ? { id: idEditando, nome: nomeServico, tipo: tipoServico } 
        : { nome: nomeServico, tipo: tipoServico };

      const response = await api.post(endpoint, payload);

      if (response.data && response.data.sucesso) {
        Alert.alert('Sucesso', `Serviço ${idEditando ? 'atualizado' : 'cadastrado'} com sucesso!`);
        setModalVisivel(false);
        carregarServicos();
      } else {
        Alert.alert('Erro', response.data.erro);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao conectar com o servidor.');
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
        Alert.alert('Sucesso', 'Serviço excluído.');
        carregarServicos();
      } else {
        Alert.alert('Aviso', response.data.erro);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na conexão.');
    }
  };

  // Aplicação dos Filtros
  const servicosFiltrados = servicos.filter(servico => {
    const matchBusca = servico.nome.toLowerCase().includes(busca.toLowerCase());
    const matchTipo = filtroTipo === 'Todos' || servico.tipo === filtroTipo;
    return matchBusca && matchTipo;
  });

  const renderItem = ({ item }) => {
    const isConsulta = item.tipo === 'Consulta';
    const icone = isConsulta ? 'medkit-outline' : 'flask-outline';
    const cor = isConsulta ? '#007BFF' : '#20c997';
    
    // Indicador visual de vagas (0 ou null/undefined)
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
            style={[styles.actionBtn, { backgroundColor: semVagas ? '#fd7e14' : '#17a2b8' }]} 
            onPress={() => navigation.navigate('GerenciarAgenda', { servico_id: item.id, servico_nome: item.nome })}
          >
            <Ionicons name={semVagas ? "warning-outline" : "calendar"} size={16} color="#fff" />
            <Text style={styles.actionText}>Agenda</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#dc3545' }]} onPress={() => confirmarExclusao(item.id, item.nome)}>
            <Ionicons name="trash" size={16} color="#fff" />
            <Text style={styles.actionText}>Excluir</Text>
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
      
      {/* Área de Filtros e Busca */}
      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Buscar por nome..."
            value={busca}
            onChangeText={setBusca}
          />
          {busca !== '' && (
            <TouchableOpacity onPress={() => setBusca('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.filterTabs}>
          {['Todos', 'Consulta', 'Exame'].map(tipo => (
            <TouchableOpacity 
              key={tipo}
              style={[styles.tabBtn, filtroTipo === tipo && styles.tabBtnActive]}
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
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Modal de Cadastro/Edição */}
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
            />

            <Text style={styles.label}>Tipo de Serviço</Text>
            <View style={styles.rowButtons}>
              <TouchableOpacity 
                style={[styles.typeButton, tipoServico === 'Consulta' && styles.typeButtonActive]}
                onPress={() => setTipoServico('Consulta')}
              >
                <Text style={[styles.typeButtonText, tipoServico === 'Consulta' && styles.typeButtonTextActive]}>Consulta</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.typeButton, tipoServico === 'Exame' && styles.typeButtonActive]}
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

      {/* Modal de Exclusão */}
      <Modal visible={modalExclusaoVisivel} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Excluir Serviço</Text>
            <Text style={styles.modalText}>
              Tem certeza que deseja excluir o serviço "{servicoExcluir.nome}"? Esta ação não poderá ser desfeita.
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#666', fontSize: 16 },
  
  // Filtros e Busca
  filterSection: { padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 12 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: '#333' },
  filterTabs: { flexDirection: 'row', justifyContent: 'space-between' },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 20, marginHorizontal: 4, backgroundColor: '#f0f0f0' },
  tabBtnActive: { backgroundColor: '#007BFF' },
  tabText: { color: '#666', fontWeight: 'bold', fontSize: 13 },
  tabTextActive: { color: '#fff' },

  // Lista
  card: { backgroundColor: '#fff', marginHorizontal: 15, marginTop: 15, padding: 15, borderRadius: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 } },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  iconContainer: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardInfo: { flex: 1 },
  servicoNome: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  servicoTipo: { fontSize: 14, color: '#666', marginTop: 2 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 6, flex: 1, marginHorizontal: 3 },
  actionText: { color: '#fff', fontWeight: 'bold', marginLeft: 5, fontSize: 13 },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#007BFF', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  
  // Modais
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '85%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15, textAlign: 'center' },
  modalText: { fontSize: 16, color: '#666', marginBottom: 25, textAlign: 'center', lineHeight: 22 },
  label: { fontSize: 14, color: '#333', marginBottom: 8, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20 },
  rowButtons: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  typeButton: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  typeButtonActive: { backgroundColor: '#007BFF', borderColor: '#007BFF' },
  typeButtonText: { color: '#666', fontWeight: 'bold' },
  typeButtonTextActive: { color: '#fff' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  btnCancelar: { flex: 1, padding: 15, backgroundColor: '#f0f0f0', borderRadius: 8, alignItems: 'center', marginRight: 10 },
  btnCancelarTexto: { color: '#333', fontWeight: 'bold', fontSize: 16 },
  btnSalvar: { flex: 1, padding: 15, backgroundColor: '#28a745', borderRadius: 8, alignItems: 'center', marginLeft: 10 },
  btnSalvarTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  btnCancelarAcao: { padding: 12, borderRadius: 8, backgroundColor: '#f0f0f0', flex: 1, marginRight: 10, alignItems: 'center' },
  btnCancelarTextoAcao: { color: '#333', fontWeight: 'bold', fontSize: 16 },
  btnConfirmarExclusao: { padding: 12, borderRadius: 8, backgroundColor: '#dc3545', flex: 1, marginLeft: 10, alignItems: 'center' },
  btnTextoBranco: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});