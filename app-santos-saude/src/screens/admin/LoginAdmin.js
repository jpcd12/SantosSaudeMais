import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function LoginAdmin({ navigation }) {
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const mascaraCpf = (valor) => {
    return valor
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const realizarLogin = async () => {
    if (cpf.trim() === '' || senha.trim() === '') {
      Alert.alert('Atenção', 'Preencha o CPF e a senha.');
      return;
    }

    setLoading(true);
    try {
      // Remove pontos e traços antes de enviar para a API
      const cpfLimpo = cpf.replace(/\D/g, '');
      
      const response = await api.post('/admin/login.php', { cpf: cpfLimpo, senha });

      if (response.data && response.data.sucesso) {
        await AsyncStorage.setItem('adminToken', response.data.admin.id.toString());
        await AsyncStorage.setItem('adminNome', response.data.admin.nome);

        navigation.reset({
          index: 0,
          routes: [{ name: 'HomeAdmin' }],
        });
      } else {
        Alert.alert('Erro', response.data.erro);
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Acesso Restrito</Text>
      <Text style={styles.subtitle}>Painel do Administrador</Text>
      
      <TouchableOpacity style={styles.btnVoltar} onPress={() => navigation.navigate('Login')}>
        <Ionicons name="arrow-back" size={18} color="#007BFF" />
        <Text style={styles.textoVoltar}>Voltar para o Portal do Paciente</Text>
      </TouchableOpacity>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="CPF"
          keyboardType="numeric"
          value={cpf}
          onChangeText={(texto) => setCpf(mascaraCpf(texto))}
          maxLength={14}
        />

        <TextInput
          style={styles.input}
          placeholder="Senha"
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />

        <TouchableOpacity style={styles.btnLogin} onPress={realizarLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnTexto}>Entrar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 40 },
  form: { backgroundColor: '#fff', padding: 20, borderRadius: 10, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 } },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 15, fontSize: 16, marginBottom: 15, backgroundColor: '#f9f9f9' },
  btnLogin: { backgroundColor: '#343a40', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnTexto: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  btnVoltar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  textoVoltar: { color: '#007BFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});