import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { ThemeContext } from '../contexts/ThemeContext';

const formatarDataNascimento = (dataString) => {
  if (!dataString) return 'Não informada';
  const [ano, mes, dia] = dataString.split('-');
  return `${dia}/${mes}/${ano}`;
};

const formatarCPF = (text) => text ? text.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').substring(0, 14) : '';

const validarCPF = (cpf) => {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let soma = 0;
  let resto;
  for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i), 10) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10), 10)) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i), 10) * (12 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11), 10)) return false;

  return true;
};

const formatarTelefone = (text) => {
  if (!text) return '';
  const tel = text.replace(/\D/g, '').substring(0, 11);
  if (tel.length > 10) return tel.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  if (tel.length > 6) return tel.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  if (tel.length > 2) return tel.replace(/(\d{2})(\d{0,5})/, '($1) $2');
  return tel;
};

export default function MeuPerfil() {
  const { theme, showAlert } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ cpf: '', telefone: '', telefone2: '', telefone3: '', email: '' });

  useEffect(() => {
    let mounted = true;

    const carregarPerfil = async () => {
      try {
        const tokenCpf = await AsyncStorage.getItem('userToken');
        if (!tokenCpf) return;

        const response = await api.get(`/paciente/perfil.php?cpf=${tokenCpf}`);
        if (mounted && response.data?.sucesso) {
          const dados = response.data.perfil;
          setPerfil(dados);
          setForm({
            cpf: formatarCPF(dados.cpf),
            telefone: formatarTelefone(dados.telefone),
            telefone2: formatarTelefone(dados.telefone2 || ''),
            telefone3: formatarTelefone(dados.telefone3 || ''),
            email: dados.email || '',
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    carregarPerfil();
    return () => {
      mounted = false;
    };
  }, []);

  const cancelarEdicao = () => {
    setForm({
      cpf: formatarCPF(perfil?.cpf),
      telefone: formatarTelefone(perfil?.telefone),
      telefone2: formatarTelefone(perfil?.telefone2 || ''),
      telefone3: formatarTelefone(perfil?.telefone3 || ''),
      email: perfil?.email || '',
    });
    setEditando(false);
  };

  const salvarPerfil = async () => {
    const cpfNovo = form.cpf.replace(/\D/g, '');
    const telefone = form.telefone.replace(/\D/g, '');
    const telefone2 = form.telefone2.replace(/\D/g, '');
    const telefone3 = form.telefone3.replace(/\D/g, '');
    const email = form.email.trim();

    if (!validarCPF(cpfNovo)) {
      showAlert('Erro de Validação', 'O CPF informado é inválido.');
      return;
    }

    if (telefone.length < 10 || telefone.length > 11) {
      showAlert('Dados inválidos', 'Informe um telefone principal com DDD.');
      return;
    }

    if ((telefone2 && telefone2.length < 10) || (telefone3 && telefone3.length < 10)) {
      showAlert('Dados inválidos', 'Os telefones opcionais devem incluir o DDD.');
      return;
    }

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      showAlert('Dados inválidos', 'Informe um e-mail válido.');
      return;
    }

    setSalvando(true);
    try {
      const cpfAtual = String(perfil?.cpf || '').replace(/\D/g, '');
      const response = await api.post('/paciente/atualizar_perfil.php', {
        cpf_atual: cpfAtual,
        cpf_novo: cpfNovo,
        telefone,
        telefone2,
        telefone3,
        email,
      });

      if (!response.data?.sucesso) {
        showAlert('Não foi possível salvar', response.data?.erro || 'Tente novamente.');
        return;
      }

      const dadosAtualizados = { ...perfil, cpf: cpfNovo, telefone, telefone2, telefone3, email };
      setPerfil(dadosAtualizados);
      setForm({
        cpf: formatarCPF(cpfNovo),
        telefone: formatarTelefone(telefone),
        telefone2: formatarTelefone(telefone2),
        telefone3: formatarTelefone(telefone3),
        email,
      });
      if (cpfAtual !== cpfNovo) {
        await AsyncStorage.setItem('userToken', cpfNovo);
      }
      setEditando(false);
      showAlert('Perfil atualizado', 'Suas informações foram salvas.');
    } catch (error) {
      showAlert('Não foi possível salvar', error.customMessage || 'Tente novamente mais tarde.');
    } finally {
      setSalvando(false);
    }
  };

  if (loading && !perfil) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={80} color={theme.primary} />
        <Text style={styles.nome}>{perfil?.nome}</Text>
        <Text style={styles.dataNascText}>Nascido(a) em {formatarDataNascimento(perfil?.dt_nasc)}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.headerCard}>
          <Text style={styles.cardTitle}>Dados de Contato e Documento</Text>
          {!editando && (
            <TouchableOpacity onPress={() => setEditando(true)} accessibilityRole="button" accessibilityLabel="Editar dados do perfil">
              <Ionicons name="create-outline" size={24} color={theme.primary} />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.divider} />

        <View style={styles.fieldRow}>
          <Ionicons name="card-outline" size={22} color={theme.icon} style={styles.icon} />
          <View style={styles.inputContainer}>
            <Text style={styles.label}>CPF *</Text>
            {editando ? (
              <TextInput style={styles.input} value={form.cpf} onChangeText={(t) => setForm({ ...form, cpf: formatarCPF(t) })} keyboardType="numeric" placeholderTextColor={theme.textSecondary} />
            ) : (
              <Text style={styles.value}>{formatarCPF(perfil?.cpf)}</Text>
            )}
          </View>
        </View>

        <View style={styles.fieldRow}>
          <Ionicons name="call-outline" size={22} color={theme.icon} style={styles.icon} />
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Telefone Principal *</Text>
            {editando ? (
              <TextInput style={styles.input} value={form.telefone} onChangeText={(t) => setForm({ ...form, telefone: formatarTelefone(t) })} keyboardType="phone-pad" placeholderTextColor={theme.textSecondary} />
            ) : (
              <Text style={styles.value}>{formatarTelefone(perfil?.telefone) || 'Não informado'}</Text>
            )}
          </View>
        </View>

        {(editando || perfil?.telefone2) && (
          <View style={styles.fieldRow}>
            <Ionicons name="call-outline" size={22} color={theme.border} style={styles.icon} />
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Telefone 2 (Opcional)</Text>
              {editando ? (
                <TextInput style={styles.input} value={form.telefone2} onChangeText={(t) => setForm({ ...form, telefone2: formatarTelefone(t) })} keyboardType="phone-pad" placeholderTextColor={theme.textSecondary} />
              ) : (
                <Text style={styles.value}>{formatarTelefone(perfil?.telefone2)}</Text>
              )}
            </View>
          </View>
        )}

        {(editando || perfil?.telefone3) && (
          <View style={styles.fieldRow}>
            <Ionicons name="call-outline" size={22} color={theme.border} style={styles.icon} />
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Telefone 3 (Opcional)</Text>
              {editando ? (
                <TextInput style={styles.input} value={form.telefone3} onChangeText={(t) => setForm({ ...form, telefone3: formatarTelefone(t) })} keyboardType="phone-pad" placeholderTextColor={theme.textSecondary} />
              ) : (
                <Text style={styles.value}>{formatarTelefone(perfil?.telefone3)}</Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.fieldRow}>
          <Ionicons name="mail-outline" size={22} color={theme.icon} style={styles.icon} />
          <View style={styles.inputContainer}>
            <Text style={styles.label}>E-mail</Text>
            {editando ? (
              <TextInput style={styles.input} value={form.email} onChangeText={(t) => setForm({ ...form, email: t })} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={theme.textSecondary} />
            ) : (
              <Text style={styles.value}>{perfil?.email || 'Não informado'}</Text>
            )}
          </View>
        </View>
      </View>

      {editando && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.btnCancelar} onPress={cancelarEdicao} disabled={salvando} accessibilityRole="button">
            <Text style={styles.btnTextoBranco}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSalvar} onPress={salvarPerfil} disabled={salvando} accessibilityRole="button">
            <Text style={styles.btnTextoBranco}>{salvando ? 'Salvando...' : 'Confirmar'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: theme.background, padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },
  header: { alignItems: 'center', marginBottom: 25, marginTop: 10 },
  nome: { fontSize: 22, fontWeight: 'bold', color: theme.text, marginTop: 10, textAlign: 'center' },
  dataNascText: { fontSize: 15, color: theme.textSecondary, marginTop: 4 },
  card: { backgroundColor: theme.card, padding: 20, borderRadius: 10, elevation: 2 },
  headerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: theme.text },
  divider: { height: 1, backgroundColor: theme.border, marginVertical: 15 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  icon: { width: 30 },
  inputContainer: { flex: 1 },
  label: { fontSize: 13, color: theme.textSecondary, marginBottom: 4 },
  value: { fontSize: 16, color: theme.text, fontWeight: '500' },
  input: { borderBottomWidth: 1, borderBottomColor: theme.border, fontSize: 16, color: theme.text, paddingVertical: 5 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  btnCancelar: { backgroundColor: theme.dangerAction, padding: 15, borderRadius: 8, flex: 1, alignItems: 'center', marginRight: 10 },
  btnSalvar: { backgroundColor: theme.successAction, padding: 15, borderRadius: 8, flex: 1, alignItems: 'center', marginLeft: 10 },
  btnTextoBranco: { color: theme.onAction, fontWeight: 'bold', fontSize: 16 }
});
