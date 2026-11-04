import React, { useState, useContext } from 'react';
import { Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { ThemeContext } from '../contexts/ThemeContext';

const maskCPF = (t) => t.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14);
const maskNome = (t) => t.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
const maskData = (t) => t.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 10);
const maskTelefone = (t) => {
  let num = t.replace(/\D/g, '');
  if (num.length <= 10) return num.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').slice(0, 14);
  return num.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').slice(0, 15);
};

const validarCPF = (cpf) => {
  const limpo = cpf.replace(/\D/g, '');
  if (limpo.length !== 11 || /^(\d)\1{10}$/.test(limpo)) return false;
  let soma = 0, resto;
  for (let i = 1; i <= 9; i++) soma += parseInt(limpo.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.substring(9, 10))) return false;
  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(limpo.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(limpo.substring(10, 11));
};

export default function Cadastro({ navigation }) {
  const { theme, showAlert } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const [form, setForm] = useState({ cpf: '', nome: '', dt_nasc: '', telefone: '', email: '', senha: '', confirmarSenha: '' });

  const handleCadastro = async () => {
    if (form.senha !== form.confirmarSenha) return showAlert('Erro', 'As senhas não coincidem.');
    if (!form.senha) return showAlert('Erro', 'A senha não pode estar vazia.');
    if (!form.email) return showAlert('Erro', 'O e-mail é obrigatório para fins de recuperação de senha.');

    const cpfLimpo = form.cpf.replace(/\D/g, '');
    if (!validarCPF(cpfLimpo)) return showAlert('Erro', 'CPF inválido.');
    
    if (form.dt_nasc.length !== 10) return showAlert('Erro', 'Data de nascimento incompleta.');
    const [dia, mes, ano] = form.dt_nasc.split('/');
    const dataMySQL = `${ano}-${mes}-${dia}`;
    
    const telefoneLimpo = form.telefone.replace(/\D/g, '');

    try {
      const response = await api.post('/paciente/cadastrar.php', {
        cpf: cpfLimpo,
        nome: form.nome,
        dt_nasc: dataMySQL,
        telefone: telefoneLimpo,
        email: form.email.trim(),
        senha: form.senha
      });
      showAlert('Sucesso', response.data.mensagem, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error) {
      showAlert('Erro', error.response?.data?.mensagem || 'Falha ao conectar.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Ionicons name="person-add-outline" size={60} color={theme.primary} style={styles.accountIcon} />
      <Text style={styles.welcomeTitle}>Boas-vindas ao Santos Saúde+</Text>
      <Text style={styles.instructions}>Preencha o formulário abaixo para criar sua conta.</Text>
      <Text style={styles.inputLabel} nativeID="cadastro-cpf-label">CPF</Text>
      <TextInput nativeID="cadastro-cpf" accessibilityLabel="CPF" accessibilityLabelledBy="cadastro-cpf-label" style={styles.input} placeholder="000.000.000-00" placeholderTextColor={theme.textSecondary} keyboardType="numeric" value={form.cpf} onChangeText={t => setForm({...form, cpf: maskCPF(t)})} />
      <Text style={styles.inputLabel} nativeID="cadastro-nome-label">Nome completo</Text>
      <TextInput nativeID="cadastro-nome" accessibilityLabel="Nome completo" accessibilityLabelledBy="cadastro-nome-label" style={styles.input} placeholder="Ex.: Maria da Silva" placeholderTextColor={theme.textSecondary} value={form.nome} onChangeText={t => setForm({...form, nome: maskNome(t)})} />
      <Text style={styles.inputLabel} nativeID="cadastro-nascimento-label">Data de nascimento</Text>
      <TextInput nativeID="cadastro-nascimento" accessibilityLabel="Data de nascimento" accessibilityLabelledBy="cadastro-nascimento-label" style={styles.input} placeholder="DD/MM/AAAA" placeholderTextColor={theme.textSecondary} keyboardType="numeric" value={form.dt_nasc} onChangeText={t => setForm({...form, dt_nasc: maskData(t)})} />
      <Text style={styles.inputLabel} nativeID="cadastro-telefone-label">Telefone</Text>
      <TextInput nativeID="cadastro-telefone" accessibilityLabel="Telefone" accessibilityLabelledBy="cadastro-telefone-label" style={styles.input} placeholder="(00) 00000-0000" placeholderTextColor={theme.textSecondary} keyboardType="numeric" value={form.telefone} onChangeText={t => setForm({...form, telefone: maskTelefone(t)})} />
      
      <Text style={styles.inputLabel} nativeID="cadastro-email-label">E-mail</Text>
      <TextInput nativeID="cadastro-email" accessibilityLabel="E-mail" accessibilityLabelledBy="cadastro-email-label" style={styles.input} placeholder="exemplo@email.com" placeholderTextColor={theme.textSecondary} keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={t => setForm({...form, email: t})} />
      
      <Text style={styles.inputLabel} nativeID="cadastro-senha-label">Senha</Text>
      <TextInput nativeID="cadastro-senha" accessibilityLabel="Senha" accessibilityLabelledBy="cadastro-senha-label" style={styles.input} placeholder="Digite sua senha" placeholderTextColor={theme.textSecondary} secureTextEntry value={form.senha} onChangeText={t => setForm({...form, senha: t})} />
      <Text style={styles.inputLabel} nativeID="cadastro-confirmar-senha-label">Confirmar senha</Text>
      <TextInput nativeID="cadastro-confirmar-senha" accessibilityLabel="Confirmar senha" accessibilityLabelledBy="cadastro-confirmar-senha-label" style={styles.input} placeholder="Repita sua senha" placeholderTextColor={theme.textSecondary} secureTextEntry value={form.confirmarSenha} onChangeText={t => setForm({...form, confirmarSenha: t})} />
      <TouchableOpacity style={styles.button} onPress={handleCadastro} accessibilityRole="button">
        <Text style={styles.buttonText}>Cadastrar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 20, backgroundColor: theme.background },
  accountIcon: { alignSelf: 'center', marginBottom: 12 },
  welcomeTitle: { color: theme.text, fontSize: 22, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  instructions: { fontSize: 15, color: theme.textSecondary, marginBottom: 20, lineHeight: 22, textAlign: 'center' },
  inputLabel: { color: theme.text, fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: theme.border, padding: 10, marginBottom: 15, borderRadius: 5, color: theme.text, backgroundColor: theme.card },
  button: { backgroundColor: theme.successAction, padding: 15, borderRadius: 5, alignItems: 'center' },
  buttonText: { color: theme.onAction, fontWeight: 'bold' }
});
