import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const maskCPF = (t) => t.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14);

export default function Login({ navigation }) {
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');

  const handleLogin = async () => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    if (!cpfLimpo) return Alert.alert('Erro', 'O CPF não pode estar vazio.');
    if (!senha) return Alert.alert('Erro', 'A senha não pode estar vazia.');

    try {
      const response = await api.post('/paciente/login.php', { cpf: cpfLimpo, senha });
      await AsyncStorage.setItem('userToken', cpfLimpo);
      navigation.replace('Home');
    } catch (error) {
      Alert.alert('Erro', error.response?.data?.mensagem || 'Falha ao conectar.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        activeOpacity={1} 
        onLongPress={() => navigation.navigate('LoginAdmin')}
      >
        <View style={styles.header}>
          <Ionicons name="medical" size={60} color="#007BFF" />
          <Text style={styles.title}>Santos Saúde+</Text>
        </View>
      </TouchableOpacity>

      <TextInput 
        style={styles.input} 
        placeholder="CPF" 
        value={cpf} 
        onChangeText={t => setCpf(maskCPF(t))} 
        keyboardType="numeric" 
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Senha" 
        value={senha} 
        onChangeText={setSenha} 
        secureTextEntry 
      />

      <TouchableOpacity 
        style={styles.forgotPassword} 
        onPress={() => navigation.navigate('RecuperacaoSenha')}
      >
        <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate('Cadastro')} style={{ marginTop: 20 }}>
        <Text style={{ textAlign: 'center', color: '#007BFF' }}>Não tem conta? Cadastre-se</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center' }, 
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 15, borderRadius: 5 },
  forgotPassword: { alignItems: 'flex-end', marginBottom: 20, marginTop: -5 },
  forgotPasswordText: { color: '#007BFF', fontWeight: '600' },
  button: { backgroundColor: '#007BFF', padding: 15, borderRadius: 5, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});