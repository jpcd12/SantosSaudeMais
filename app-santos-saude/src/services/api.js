import { create } from 'axios';
import { showGlobalAlert } from '../contexts/ThemeContext';

const api = create({
  baseURL: 'http://10.0.2.2/santos-saude-api/api', 
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
