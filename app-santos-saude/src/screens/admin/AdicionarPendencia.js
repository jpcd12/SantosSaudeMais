import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function AdicionarPendencia({ route, navigation }) {
  const { paciente_id, paciente_nome } = route.params;
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('Consulta');
  
  // Modais
  const [modalVisivel, setModalVisivel] = useState(false);
  const [modalDuplicadaVisivel, setModalDuplicadaVisivel] = useState(false);
  const [servicoSelecionado, setServicoSelecionado] = useState(null);

  useEffect(() => {
    carregarServicos();
  }, []);

  const carregarServicos = async () => {
    try {
      const response = await api.get('/admin/listar_servicos.php');
      if (response.data && response.data.sucesso) {
        setServicos(response.data.servicos);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao buscar os serviços.');
    } finally {
      setLoading(false);
    }
  };

  const confirmarAdicao = async () => {
    setModalVisivel(false);
    try {
      const response = await api.post('/admin/adicionar_pendencia.php', {
        paciente_id: paciente_id,
        servico_id: servicoSelecionado.id
      });

      if (response.data && response.data.sucesso) {
        Alert.alert('Sucesso', 'Pendência adicionada ao paciente.');
        navigation.goBack();
      } else if (response.data && response.data.duplicada) {
        setModalDuplicadaVisivel(true);
      } else {
        Alert.alert('Erro', response.data.erro);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha na conexão.');
    }
  };

  const servicosFiltrados = servicos.filter(s => 
    s.tipo === filtroTipo && s.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const renderItem = ({ item }) => {
    const isConsulta = item.tipo === 'Consulta';
    const icone = isConsulta ? 'medkit-outline' : 'flask-outline';
    const cor = isConsulta ? '#007BFF' : '#20c997';

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
        <Ionicons name="add-circle" size={28} color="#28a745" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#007BFF" /></View>;
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
              style={[styles.tabBtn, filtroTipo === tipo && styles.tabBtnActive]}
              onPress={() => setFiltroTipo(tipo)}
            >
              <Text style={[styles.tabText, filtroTipo === tipo && styles.tabTextActive]}>{tipo}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput 
            style={styles.searchInput}
            placeholder={`Buscar ${filtroTipo.toLowerCase()}...`}
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

      {/* Modal de Confirmação de Adição */}
      <Modal visible={modalVisivel} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Adicionar Pendência</Text>
            <Text style={styles.modalText}>
              Deseja adicionar o encaminhamento para <Text style={{fontWeight: 'bold'}}>{servicoSelecionado?.nome}</Text> ao paciente {paciente_nome}?
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

      {/* Modal de Aviso de Duplicidade */}
      <Modal visible={modalDuplicadaVisivel} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Ionicons name="alert-circle-outline" size={50} color="#dc3545" style={{ alignSelf: 'center', marginBottom: 10 }} />
            <Text style={styles.modalTitle}>Pendência Já Existente</Text>
            <Text style={styles.modalText}>
              O paciente <Text style={{fontWeight: 'bold'}}>{paciente_nome}</Text> já possui uma pendência ativa para o serviço <Text style={{fontWeight: 'bold'}}>{servicoSelecionado?.nome}</Text>.
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  headerSubtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  
  filterSection: { padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd', marginBottom: 10 },
  filterTabs: { flexDirection: 'row', marginBottom: 12 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, marginHorizontal: 4, backgroundColor: '#f0f0f0' },
  tabBtnActive: { backgroundColor: '#007BFF' },
  tabText: { color: '#666', fontWeight: 'bold', fontSize: 14 },
  tabTextActive: { color: '#fff' },
  
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: '#333' },
  
  emptyText: { textAlign: 'center', marginTop: 40, color: '#666', fontSize: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 15, marginBottom: 10, padding: 15, borderRadius: 10, elevation: 2 },
  iconContainer: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardInfo: { flex: 1 },
  servicoNome: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  servicoTipo: { fontSize: 14, color: '#666', marginTop: 2 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#fff', padding: 25, borderRadius: 10, width: '85%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15, textAlign: 'center' },
  modalText: { fontSize: 16, color: '#666', marginBottom: 25, textAlign: 'center', lineHeight: 22 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  btnCancelar: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#f0f0f0', alignItems: 'center', marginRight: 10 },
  btnCancelarTexto: { color: '#333', fontWeight: 'bold', fontSize: 14 },
  btnSalvar: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#28a745', alignItems: 'center', marginLeft: 10 },
  btnOk: { padding: 12, borderRadius: 8, backgroundColor: '#007BFF', alignItems: 'center', width: '100%' },
  btnTextoBranco: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});