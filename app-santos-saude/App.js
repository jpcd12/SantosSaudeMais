import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Login from './src/screens/Login';
import Cadastro from './src/screens/Cadastro';
import Home from './src/screens/Home';
import AgendarPendencia from './src/screens/AgendarPendencia';
import SelecaoHorario from './src/screens/SelecaoHorario';
import MeusAgendamentos from './src/screens/MeusAgendamentos';
import MeuPerfil from './src/screens/MeuPerfil';
import Historico from './src/screens/Historico';
import LoginAdmin from './src/screens/admin/LoginAdmin';
import GerenciarServicos from './src/screens/admin/GerenciarServicos';
import HomeAdmin from './src/screens/admin/HomeAdmin';
import GerenciarAgenda from './src/screens/admin/GerenciarAgenda';
import ControlePendencias from './src/screens/admin/ControlePendencias';
import PendenciasPaciente from './src/screens/admin/PendenciasPaciente';
import AdicionarPendencia from './src/screens/admin/AdicionarPendencia';
import RecuperacaoSenha from './src/screens/RecuperacaoSenha';
import { StackScreen } from 'expo-router/build/layouts/stack-utils/StackScreen.js';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        setUserToken(token);
      } catch (error) {
        console.error('Erro ao ler a sessão');
      } finally {
        setIsLoading(false);
      }
    };
    checkToken();
  }, []);

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

//<Stack.Navigator initialRouteName={userToken ? 'Home' : 'Login'}>

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={userToken ? 'Home' : 'Login'}>
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="Cadastro" component={Cadastro} options={{ title: 'Criar Conta' }} />
        <Stack.Screen name="Home" component={Home} options={{ title: 'Início' }} />
        <Stack.Screen name="AgendarPendencia" component={AgendarPendencia} options={{ title: 'Agendar Pendências' }} />
        <Stack.Screen name="SelecaoHorario" component={SelecaoHorario} options={{ title: 'Escolher Horário' }} />
        <Stack.Screen name="MeusAgendamentos" component={MeusAgendamentos} options={{ title: 'Meus Agendamentos' }} />
        <Stack.Screen name="MeuPerfil" component={MeuPerfil} options={{ title: 'Meu Perfil' }} />
        <Stack.Screen name="Historico" component={Historico} options={{ title: 'Histórico de Agendamentos' }} />
        <Stack.Screen name="LoginAdmin" component={LoginAdmin} options={{ headerShown: false }} />
        <Stack.Screen name="GerenciarServicos" component={GerenciarServicos} options={{ title: 'Gerenciar Serviços' }} />
        <Stack.Screen name="HomeAdmin" component={HomeAdmin} options={{ title: 'Painel Administrativo' }} />
        <Stack.Screen name="GerenciarAgenda" component={GerenciarAgenda} options={{ title: 'Agenda do Serviço' }} />
        <Stack.Screen name="ControlePendencias" component={ControlePendencias} options={{ title: 'Controle de Pendências' }} />
        <Stack.Screen name="PendenciasPaciente" component={PendenciasPaciente} options={{ title: 'Pendências do Paciente' }} />
        <Stack.Screen name="AdicionarPendencia" component={AdicionarPendencia} options={{ title: 'Vincular Serviço' }} />
        <Stack.Screen name="RecuperacaoSenha" component={RecuperacaoSenha} options={{ title: 'Recuperação de Senha '}} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}