import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { ThemeContext } from '../../contexts/ThemeContext';

export default function LoginAdmin({ navigation }) {
  const { theme, showAlert, isDark, toggleTheme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const mascaraCpf = (valor) => valor.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');

  const realizarLogin = async () => {
    if (cpf.trim() === '' || senha.trim() === '') return showAlert('Atenção', 'Preencha o CPF e a senha.');
    setLoading(true);
    try {
      const cpfLimpo = cpf.replace(/\D/g, '');
      const response = await api.post('/admin/login.php', { cpf: cpfLimpo, senha });

      if (response.data && response.data.sucesso) {
        await AsyncStorage.setItem('adminToken', response.data.admin.id.toString());
        await AsyncStorage.setItem('adminNome', response.data.admin.nome);
        navigation.reset({ index: 0, routes: [{ name: 'HomeAdmin' }] });
      } else {
        showAlert('Erro', response.data.erro);
      }
    } catch (_error) {
      showAlert('Erro', 'Falha ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
        <Ionicons name={isDark ? "sunny" : "moon"} size={28} color={theme.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Acesso Restrito</Text>
        <Text style={styles.subtitle}>Painel do Administrador</Text>
        
        <TouchableOpacity style={styles.btnVoltar} onPress={() => navigation.navigate('Login')}>
          <Ionicons name="arrow-back" size={18} color={theme.primary} />
          <Text style={styles.textoVoltar}>Voltar para o Portal do Paciente</Text>
        </TouchableOpacity>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="CPF"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
            value={cpf}
            onChangeText={(texto) => setCpf(mascaraCpf(texto))}
            maxLength={14}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
          />
          <TouchableOpacity style={styles.btnLogin} onPress={realizarLogin} disabled={loading}>
            {loading ? <ActivityIndicator color={theme.background} /> : <Text style={styles.btnTexto}>Entrar</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  themeToggle: { position: 'absolute', top: 50, right: 25, zIndex: 10 },
  content: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: theme.text, textAlign: 'center', marginBottom: 5 },
  subtitle: { fontSize: 16, color: theme.textSecondary, textAlign: 'center', marginBottom: 40 },
  form: { backgroundColor: theme.card, padding: 20, borderRadius: 10, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, borderWidth: 1, borderColor: theme.border },
  input: { borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 15, fontSize: 16, marginBottom: 15, backgroundColor: theme.background, color: theme.text },
  btnLogin: { backgroundColor: theme.text, padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnTexto: { color: theme.background, fontWeight: 'bold', fontSize: 18 },
  btnVoltar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  textoVoltar: { color: theme.primary, fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});
