import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function RecuperacaoSenha({ navigation }) {
  const [etapa, setEtapa] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [cpf, setCpf] = useState('');
  const [emailMascarado, setEmailMascarado] = useState('');
  const [pinCorreto, setPinCorreto] = useState('');
  
  const [pinDigitado, setPinDigitado] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const formatarCPF = (text) => {
    return text.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').substring(0, 14);
  };

  const solicitarCodigo = async () => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      Alert.alert('Aviso', 'Digite um CPF válido.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/paciente/solicitar_recuperacao.php', { cpf: cpfLimpo });
      
      if (response.data && response.data.sucesso) {
        setEmailMascarado(response.data.email_mascarado);
        setPinCorreto(String(response.data.pin_simulado));
        setEtapa(2);
        
        // Simulação de envio para o TCC
        Alert.alert('Simulação TCC', `Um código foi enviado para o e-mail ${response.data.email_mascarado}.\n\nCÓDIGO: ${response.data.pin_simulado}`);
      }
    } catch (error) {
      if (error.response?.data?.sem_email) {
        Alert.alert('Atenção', error.response.data.erro);
      } else {
        Alert.alert('Erro', error.response?.data?.erro || 'Falha ao conectar com o servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  const redefinirSenha = async () => {
    if (pinDigitado !== pinCorreto) {
      Alert.alert('Erro', 'O código de verificação está incorreto.');
      return;
    }
    if (!novaSenha || novaSenha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem ou estão vazias.');
      return;
    }

    try {
      setLoading(true);
      const cpfLimpo = cpf.replace(/\D/g, '');
      const response = await api.post('/paciente/redefinir_senha.php', { 
        cpf: cpfLimpo, 
        nova_senha: novaSenha 
      });
      
      if (response.data && response.data.sucesso) {
        Alert.alert('Sucesso', 'Sua senha foi redefinida. Você já pode fazer login.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Erro', error.response?.data?.erro || 'Falha ao redefinir a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="lock-closed-outline" size={80} color="#007BFF" />
        <Text style={styles.title}>Recuperar Senha</Text>
      </View>

      {etapa === 1 ? (
        <View style={styles.form}>
          <Text style={styles.instructions}>Digite seu CPF para receber o código de verificação.</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Digite seu CPF" 
            keyboardType="numeric" 
            value={cpf} 
            onChangeText={(t) => setCpf(formatarCPF(t))} 
          />
          <TouchableOpacity style={styles.button} onPress={solicitarCodigo} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Buscar Cadastro</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.instructions}>Código enviado para: {emailMascarado}</Text>
          
          <TextInput 
            style={styles.input} 
            placeholder="Código de 4 dígitos" 
            keyboardType="numeric"
            maxLength={4}
            value={pinDigitado} 
            onChangeText={setPinDigitado} 
          />
          <TextInput 
            style={styles.input} 
            placeholder="Nova Senha" 
            secureTextEntry 
            value={novaSenha} 
            onChangeText={setNovaSenha} 
          />
          <TextInput 
            style={styles.input} 
            placeholder="Confirmar Nova Senha" 
            secureTextEntry 
            value={confirmarSenha} 
            onChangeText={setConfirmarSenha} 
          />
          
          <TouchableOpacity style={styles.button} onPress={redefinirSenha} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Redefinir Senha</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 10 },
  form: { backgroundColor: '#fff', padding: 20, borderRadius: 10, elevation: 2 },
  instructions: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 15, borderRadius: 5, fontSize: 16 },
  button: { backgroundColor: '#007BFF', padding: 15, borderRadius: 5, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});