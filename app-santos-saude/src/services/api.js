import { create } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { showGlobalAlert } from '../contexts/ThemeContext';

const ANDROID_EMULATOR_API_URL = 'http://10.0.2.2/santos-saude-api/api';
const API_PATH = '/santos-saude-api/api';

function getPrivateLanHost(hostUri) {
  const match = hostUri?.match(/^((?:\d{1,3}\.){3}\d{1,3})(?::\d+)?$/);
  if (!match) return null;

  const octets = match[1].split('.').map(Number);
  if (octets.some((octet) => octet < 0 || octet > 255)) return null;

  const [first, second] = octets;
  const isPrivateLanAddress =
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168);

  return isPrivateLanAddress ? match[1] : null;
}

function getApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/+$/, '');

  // Expo CLI embeds its LAN host in expoConfig while a development session is active.
  // Only use it on iOS development builds and only when it is a private IPv4 address.
  if (Platform.OS === 'ios' && __DEV__) {
    const host = getPrivateLanHost(Constants.expoConfig?.hostUri);
    if (host) return `http://${host}${API_PATH}`;
  }

  // 10.0.2.2 is the host machine alias for the Android emulator.
  if (Platform.OS === 'android') return ANDROID_EMULATOR_API_URL;

  return undefined;
}

const api = create({
  baseURL: getApiBaseUrl(),
  timeout: 10000, // Cancela a requisição automaticamente após 10 segundos
});

// Interceptador de Respostas
api.interceptors.response.use(
  (response) => {
    // Se a requisição deu certo, apenas retorna a resposta normalmente
    return response;
  },
  (error) => {
    let mensagemAmigavel = 'Ocorreu um erro inesperado. Tente novamente mais tarde.';

    // Se 'error.response' for undefined, significa que não houve resposta do servidor (Sem Internet ou Servidor Offline)
    if (!error.response) {
      mensagemAmigavel = 'Você parece estar sem conexão com a internet ou o sistema está temporariamente indisponível. Verifique seu Wi-Fi ou dados móveis.';
      
      // Mostra o aviso usando o diálogo tematizado do app.
      showGlobalAlert('Sem Conexão', mensagemAmigavel);
    } 
    // Se houve resposta de erro do PHP (ex: 400, 404, 500), pega a mensagem do back-end
    else if (error.response.data && (error.response.data.erro || error.response.data.mensagem)) {
      mensagemAmigavel = error.response.data.erro || error.response.data.mensagem;
    }

    // Injeta a mensagem formatada no objeto de erro para as telas usarem, se necessário
    error.customMessage = mensagemAmigavel;
    
    return Promise.reject(error);
  }
);

export default api;
