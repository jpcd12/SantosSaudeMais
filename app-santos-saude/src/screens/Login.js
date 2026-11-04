import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { ThemeContext } from '../contexts/ThemeContext';

const maskCPF = (t) => t.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14);

export default function Login({ navigation }) {
  const { theme, showAlert, isDark, toggleTheme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');

  const handleLogin = async () => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (!cpfLimpo) return showAlert('Erro', 'O CPF não pode estar vazio.');
    if (!senha) return showAlert('Erro', 'A senha não pode estar vazia.');

    try {
      await api.post('/paciente/login.php', { cpf: cpfLimpo, senha });
      await AsyncStorage.setItem('userToken', cpfLimpo);
      navigation.replace('Home');
    } catch (error) {
      showAlert('Erro', error.response?.data?.mensagem || 'Falha ao conectar.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme} accessibilityRole="button" accessibilityLabel={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}>
        <Ionicons name={isDark ? "sunny" : "moon"} size={28} color={theme.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        <TouchableOpacity activeOpacity={1} onLongPress={() => navigation.navigate('LoginAdmin')}>
          <View style={styles.header}>
            <Ionicons name="medical" size={60} color={theme.primary} />
            <Text style={styles.title}>Santos Saúde+</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.inputLabel} nativeID="login-cpf-label">CPF</Text>
        <TextInput 
          style={styles.input} 
          nativeID="login-cpf"
          accessibilityLabel="CPF"
          accessibilityLabelledBy="login-cpf-label"
          placeholder="000.000.000-00" 
          placeholderTextColor={theme.textSecondary}
          value={cpf} 
          onChangeText={t => setCpf(maskCPF(t))} 
          keyboardType="numeric" 
        />
        
        <Text style={styles.inputLabel} nativeID="login-senha-label">Senha</Text>
        <TextInput 
          style={styles.input} 
          nativeID="login-senha"
          accessibilityLabel="Senha"
          accessibilityLabelledBy="login-senha-label"
          placeholder="Digite sua senha" 
          placeholderTextColor={theme.textSecondary}
          value={senha} 
          onChangeText={setSenha} 
          secureTextEntry 
        />

        <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate('RecuperacaoSenha')} accessibilityRole="button">
          <Text style={styles.forgotPasswordText}>Esqueci a minha senha</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleLogin} accessibilityRole="button">
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigation.navigate('Cadastro')} style={{ marginTop: 20 }} accessibilityRole="button">
          <Text style={{ textAlign: 'center', color: theme.primary }}>Não tem conta? Cadastre-se</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  themeToggle: { position: 'absolute', top: 50, right: 25, zIndex: 10 },
  content: { flex: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center' }, 
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: theme.text },
  inputLabel: { color: theme.text, fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: theme.border, padding: 12, marginBottom: 15, borderRadius: 5, color: theme.text, backgroundColor: theme.card },
  forgotPassword: { alignItems: 'flex-end', marginBottom: 20, marginTop: -5 },
  forgotPasswordText: { color: theme.primary, fontWeight: '600' },
  button: { backgroundColor: theme.primaryAction, padding: 15, borderRadius: 5, alignItems: 'center' },
  buttonText: { color: theme.onAction, fontWeight: 'bold', fontSize: 16 }
});
