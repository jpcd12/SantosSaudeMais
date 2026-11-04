# Welcome to your Expo app 👋

## API local em um iPhone físico

O app mantém `http://10.0.2.2/santos-saude-api/api` para o emulador Android. No iOS em desenvolvimento, ele usa automaticamente o endereço IPv4 privado anunciado pelo Expo CLI (`Constants.expoConfig.hostUri`) quando você inicia o projeto em LAN. `npx expo start` usa LAN por padrão. Isso pressupõe que o computador e o iPhone estejam na mesma rede Wi-Fi; se estiver usando túnel ou localhost, configure a URL explicitamente como abaixo.

Para abrir o projeto pelo Expo Go em um iPhone, entre no Expo CLI com a mesma conta usada no Expo Go. No terminal do projeto, rode `npx expo login` e autentique a conta; confirme com `npx expo whoami` e reinicie `npx expo start`. O Expo Go no iPhone exige que o CLI e o app estejam conectados à mesma conta.

Se o Windows retornar erro ao tentar abrir o navegador (`cmd.exe /c start`), use o login manual pelo PowerShell:

```powershell
$env:BROWSER = 'none'
npx expo login
```

Deixe esse comando rodando, copie para o navegador o link mais recente que ele imprimir e aprove o acesso. O terminal precisa continuar aberto até o callback terminar; não use um link de uma tentativa anterior. Depois, confirme com `npx expo whoami`. Feche esse terminal ou rode `Remove-Item Env:BROWSER` antes de iniciar o Expo normalmente.

Para apontar o app explicitamente para o XAMPP (também necessário em builds instaladas, que não têm o host do Expo), crie `.env.local` na raiz do projeto:

```dotenv
EXPO_PUBLIC_API_URL=http://<IP_LAN_DO_COMPUTADOR>/santos-saude-api/api
```

Substitua `<IP_LAN_DO_COMPUTADOR>` pelo IPv4 LAN real do computador. No Windows, encontre-o com `ipconfig` e consulte o endereço IPv4 do adaptador conectado à mesma rede Wi-Fi do iPhone. Não use `localhost`, `127.0.0.1` ou `10.0.2.2` no iPhone: esses endereços apontam para o próprio telefone ou são específicos do emulador Android. Depois de mudar `.env.local`, reinicie o Expo (`npx expo start`) e recarregue o app. Para um build instalável, defina `EXPO_PUBLIC_API_URL` no ambiente de build antes de gerar o bundle; a variável é incorporada ao app.

O Apache do XAMPP precisa estar ativo e acessível pela rede na porta configurada (a URL acima pressupõe a porta HTTP padrão 80). Permita essa porta no firewall do computador para a rede privada e verifique que o roteador não isola dispositivos Wi-Fi. No iPhone, permita **Rede Local** para o app/Expo Go quando o iOS solicitar; também é possível habilitar em **Ajustes > Privacidade e Segurança > Rede Local**. O app declara essa finalidade no `app.json`. Para HTTP local, o `app.json` habilita apenas a exceção ATS de rede local (`NSAllowsLocalNetworking`), sem liberar HTTP arbitrário para hosts públicos. Em ambientes de produção, prefira publicar a API com HTTPS.

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **example** directory and create a blank **src/app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
