import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function MeuPerfil() {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ cpf: '', telefone: '', telefone2: '', telefone3: '', email: '' });

  useEffect(() => {
    carregarPerfil();
  }, []);

  const carregarPerfil = async () => {
    try {
      const tokenCpf = await AsyncStorage.getItem('userToken');
      if (!tokenCpf) return;

      const response = await api.get(`/paciente/perfil.php?cpf=${tokenCpf}`);
      
      if (response.data && response.data.sucesso) {
        const dados = response.data.perfil;
        setPerfil(dados);
        setForm({
          cpf: formatarCPF(dados.cpf),
          telefone: formatarTelefone(dados.telefone),
          telefone2: formatarTelefone(dados.telefone2 || ''),
          telefone3: formatarTelefone(dados.telefone3 || ''),
          email: dados.email || ''
        });
      } else {
        Alert.alert('Aviso', 'Não foi possível carregar os dados do perfil.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao conectar com o servidor.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const validarCPF = (cpf) => {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    return true;
  };

  const formatarDataNascimento = (dataString) => {
    if (!dataString) return 'Não informada';
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const formatarCPF = (text) => {
    if (!text) return '';
    return text.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').substring(0, 14);
  };

  const formatarTelefone = (text) => {
    if (!text) return '';
    let tel = text.replace(/\D/g, '').substring(0, 11);
    if (tel.length > 10) {
      return tel.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (tel.length > 6) {
      return tel.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else if (tel.length > 2) {
      return tel.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    }
    return tel;
  };

  const salvarPerfil = async () => {
    const cpfLimpo = form.cpf.replace(/\D/g, '');
    const telLimpo = form.telefone.replace(/\D/g, '');
    
    if (!cpfLimpo || !telLimpo) {
      Alert.alert('Aviso', 'O CPF e o Telefone Principal são obrigatórios.');
      return;
    }
    
    if (!validarCPF(cpfLimpo)) {
      Alert.alert('Erro de Validação', 'O CPF informado é inválido.');
      return;
    }

    try {
      setLoading(true);
      const tokenCpf = await AsyncStorage.getItem('userToken');
      
      const payload = {
        cpf_atual: tokenCpf,
        cpf_novo: cpfLimpo,
        telefone: telLimpo,
        telefone2: form.telefone2.replace(/\D/g, ''),
        telefone3: form.telefone3.replace(/\D/g, ''),
        email: form.email.trim()
      };

      const response = await api.post('/paciente/atualizar_perfil.php', payload);
      
      if (response.data && response.data.sucesso) {
        if (tokenCpf !== cpfLimpo) {
          await AsyncStorage.setItem('userToken', cpfLimpo);
        }
        Alert.alert('Sucesso', 'Seus dados foram atualizados.');
        setEditando(false);
        carregarPerfil();
      } else {
        Alert.alert('Aviso', response.data.erro || 'Falha ao atualizar o perfil.');
      }
    } catch (error) {
      const mensagemErro = error.response?.data?.erro || 'Falha ao conectar com o servidor.';
      Alert.alert('Erro', mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !perfil) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={80} color="#007BFF" />
        <Text style={styles.nome}>{perfil?.nome}</Text>
        <Text style={styles.dataNascText}>Nascido(a) em {formatarDataNascimento(perfil?.dt_nasc)}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.headerCard}>
          <Text style={styles.cardTitle}>Dados de Contato e Documento</Text>
          {!editando && (
            <TouchableOpacity onPress={() => setEditando(true)}>
              <Ionicons name="create-outline" size={24} color="#007BFF" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.divider} />

        <View style={styles.fieldRow}>
          <Ionicons name="card-outline" size={22} color="#666" style={styles.icon} />
          <View style={styles.inputContainer}>
            <Text style={styles.label}>CPF *</Text>
            {editando ? (
              <TextInput 
                style={styles.input} 
                value={form.cpf} 
                onChangeText={(t) => setForm({ ...form, cpf: formatarCPF(t) })}
                keyboardType="numeric"
              />
            ) : (
              <Text style={styles.value}>{formatarCPF(perfil?.cpf)}</Text>
            )}
          </View>
        </View>

        <View style={styles.fieldRow}>
          <Ionicons name="call-outline" size={22} color="#666" style={styles.icon} />
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Telefone Principal *</Text>
            {editando ? (
              <TextInput 
                style={styles.input} 
                value={form.telefone} 
                onChangeText={(t) => setForm({ ...form, telefone: formatarTelefone(t) })}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.value}>{formatarTelefone(perfil?.telefone) || 'Não informado'}</Text>
            )}
          </View>
        </View>

        {(editando || perfil?.telefone2) && (
          <View style={styles.fieldRow}>
            <Ionicons name="call-outline" size={22} color="#ccc" style={styles.icon} />
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Telefone 2 (Opcional)</Text>
              {editando ? (
                <TextInput 
                  style={styles.input} 
                  value={form.telefone2} 
                  onChangeText={(t) => setForm({ ...form, telefone2: formatarTelefone(t) })}
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.value}>{formatarTelefone(perfil?.telefone2)}</Text>
              )}
            </View>
          </View>
        )}

        {(editando || perfil?.telefone3) && (
          <View style={styles.fieldRow}>
            <Ionicons name="call-outline" size={22} color="#ccc" style={styles.icon} />
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Telefone 3 (Opcional)</Text>
              {editando ? (
                <TextInput 
                  style={styles.input} 
                  value={form.telefone3} 
                  onChangeText={(t) => setForm({ ...form, telefone3: formatarTelefone(t) })}
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.value}>{formatarTelefone(perfil?.telefone3)}</Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.fieldRow}>
          <Ionicons name="mail-outline" size={22} color="#666" style={styles.icon} />
          <View style={styles.inputContainer}>
            <Text style={styles.label}>E-mail (Opcional)</Text>
            {editando ? (
              <TextInput 
                style={styles.input} 
                value={form.email} 
                onChangeText={(t) => setForm({ ...form, email: t })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.value}>{perfil?.email || 'Não informado'}</Text>
            )}
          </View>
        </View>
      </View>

      {editando && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.btnCancelar} onPress={() => setEditando(false)}>
            <Text style={styles.btnTextoBranco}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.btnSalvar} onPress={salvarPerfil}>
            <Text style={styles.btnTextoBranco}>Salvar Alterações</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f5f5f5', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 25, marginTop: 10 },
  nome: { fontSize: 22, fontWeight: 'bold', color: '#333', marginTop: 10, textAlign: 'center' },
  dataNascText: { fontSize: 15, color: '#666', marginTop: 4 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 } },
  headerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  icon: { width: 30 },
  inputContainer: { flex: 1 },
  label: { fontSize: 13, color: '#999', marginBottom: 4 },
  value: { fontSize: 16, color: '#333', fontWeight: '500' },
  input: { borderBottomWidth: 1, borderBottomColor: '#ccc', fontSize: 16, color: '#333', paddingVertical: 5 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  btnCancelar: { backgroundColor: '#dc3545', padding: 15, borderRadius: 8, flex: 1, marginRight: 10, alignItems: 'center' },
  btnSalvar: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, flex: 1, marginLeft: 10, alignItems: 'center' },
  btnTextoBranco: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});