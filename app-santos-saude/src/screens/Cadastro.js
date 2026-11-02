import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import api from '../services/api';

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
  const [form, setForm] = useState({ cpf: '', nome: '', dt_nasc: '', telefone: '', email: '', senha: '', confirmarSenha: '' });

  const handleCadastro = async () => {
    if (form.senha !== form.confirmarSenha) return Alert.alert('Erro', 'As senhas não coincidem.');
    if (!form.senha) return Alert.alert('Erro', 'A senha não pode estar vazia.');
    if (!form.email) return Alert.alert('Erro', 'O e-mail é obrigatório para fins de recuperação de senha.');

    const cpfLimpo = form.cpf.replace(/\D/g, '');
    if (!validarCPF(cpfLimpo)) return Alert.alert('Erro', 'CPF inválido.');
    
    if (form.dt_nasc.length !== 10) return Alert.alert('Erro', 'Data de nascimento incompleta.');
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
      Alert.alert('Sucesso', response.data.mensagem, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error) {
      Alert.alert('Erro', error.response?.data?.mensagem || 'Falha ao conectar.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput style={styles.input} placeholder="CPF" keyboardType="numeric" value={form.cpf} onChangeText={t => setForm({...form, cpf: maskCPF(t)})} />
      <TextInput style={styles.input} placeholder="Nome Completo" value={form.nome} onChangeText={t => setForm({...form, nome: maskNome(t)})} />
      <TextInput style={styles.input} placeholder="Data de Nascimento (DD/MM/AAAA)" keyboardType="numeric" value={form.dt_nasc} onChangeText={t => setForm({...form, dt_nasc: maskData(t)})} />
      <TextInput style={styles.input} placeholder="Telefone" keyboardType="numeric" value={form.telefone} onChangeText={t => setForm({...form, telefone: maskTelefone(t)})} />
      
      <TextInput style={styles.input} placeholder="E-mail" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={t => setForm({...form, email: t})} />
      
      <TextInput style={styles.input} placeholder="Senha" secureTextEntry value={form.senha} onChangeText={t => setForm({...form, senha: t})} />
      <TextInput style={styles.input} placeholder="Confirmar Senha" secureTextEntry value={form.confirmarSenha} onChangeText={t => setForm({...form, confirmarSenha: t})} />
      <TouchableOpacity style={styles.button} onPress={handleCadastro}>
        <Text style={styles.buttonText}>Cadastrar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 },
  button: { backgroundColor: '#28a745', padding: 15, borderRadius: 5, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});