console.log("Iniciando App.js");
import * as React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { UserProvider } from './userContext.js';
import WelcomeScreen from './Pantallas/Welcome/WelcomeScreen.js';
import LogInScreen from './Pantallas/LogInScreen.js';
import HomeScreen from './Pantallas/HomeScreen.js';
import SignUp from './Pantallas/SignUp.js';
import Settings from './Pantallas/Settings.js';
import AnadirGrupo from './Pantallas/AnadirGrupo.js';
import PantallaDeDetalles from './Pantallas/PantallaDetalles.js';
import DetallesDeTemporada from './Pantallas/TemporadaDetalle.js';
import EditarGrupo from './Pantallas/EditarGrupo.js';
import Calendario from './Pantallas/Calendario.js';
import ComentariosSerie from './Pantallas/ComentariosSerie.js';
import Estadisticas from './Pantallas/Estadisticas.js';
import Serie from './Pantallas/serie.js';
import RecuperarContrasena from './Pantallas/RecuperarContrasena.js';
import RecuperarContrasena2 from './Pantallas/RecuperarContrasena2.js';
import { useColorScheme } from 'react-native';

const APILAPSPARTBOX = "https://apitfg.lapspartbox.com";
const APIGOOGLE = "https://backendapi.familyseriestrack.com";
console.log("APILAPSPARTBOX:", APILAPSPARTBOX);
console.log("APIGOOGLE:", APIGOOGLE);

// Configuración de la API global (cual se usa)
global.API = APILAPSPARTBOX;
console.log("API configurada:", global.API);




console.log("Imports completados");

const Stack = createNativeStackNavigator();
console.log("------------- APP -----------------");
function App() {
  let colorScheme = useColorScheme();

  console.log("Dentro de la función App");
  // Configuración de Firebase



  return (
    <UserProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Welcome"
          screenOptions={{
            headerStyle: {
              backgroundColor: colorScheme === 'dark' ? '#121212' : '#f7f7f7',
            },
            headerTintColor: colorScheme === 'dark' ? '#ffffff' : '#000000',
            
          }}
        >
          <Stack.Screen name="Welcome" options={{ headerShown: false }} component={WelcomeScreen} />
          <Stack.Screen name="LogInScreen" options={{ headerShown: false }} component={LogInScreen} />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              headerShown: false,
              title: '',
            }}
          />
          <Stack.Screen name="SignUp" options={{ headerShown: false }} component={SignUp} />
          <Stack.Screen name="Settings" options={{ title: 'Ajustes' }} component={Settings} />
          <Stack.Screen name="Anadir Grupo" options={{ title: 'Crear Grupo' }} component={AnadirGrupo} />
          <Stack.Screen 
            name="Detalles Serie" 
            component={PantallaDeDetalles} 
            options={({ route }) => ({ 
              title: route.params?.nombreSerie || 'Detalles Serie',
            })}
          />
          <Stack.Screen name="Temporada" component={DetallesDeTemporada} />
          <Stack.Screen 
            name="Editar Grupo" 
            component={EditarGrupo} 
            options={({ route }) => ({ 
              title: `Editar ${route.params?.nombreGrupo}` || 'Editar Grupo',
            })}
          />
          <Stack.Screen name="Calendario" component={Calendario} />
          <Stack.Screen 
            name="Comentarios Serie" 
            options={({ route }) => ({ 
              title: route.params?.nombreSerie || 'Chat',
              headerTitle: () => (
                <View style={{ alignItems: 'flex-start' }}>
                  <Text style={{ 
                    fontSize: 18, 
                    fontWeight: 'bold',
                    color: colorScheme === 'dark' ? '#ffffff' : '#000000'
                  }}>
                    {route.params?.nombreSerie || 'Chat'}
                  </Text>
                  <Text style={{ 
                    fontSize: 14,
                    color: colorScheme === 'dark' ? '#ffffff' : '#000000'
                  }}>
                    {route.params?.NombreGrupo || ''}
                  </Text>
                </View>
              ),
            })} 
            component={ComentariosSerie} 
          />
          <Stack.Screen name="Estadisticas" options={{ title: 'Estadisticas' }} component={Estadisticas} />
          <Stack.Screen 
            name="Serie" 
            component={Serie} 
            options={({ route }) => ({ 
              title: route.params?.serieData?.name || 'Serie',
            })}
          />
          <Stack.Screen name="Recuperar Contrasena" component={RecuperarContrasena} options={{ headerShown: false, title: 'Recuperar Contraseña' }}/>
          <Stack.Screen name="Recuperar Contrasena2" component={RecuperarContrasena2} options={{ headerShown: false, title: 'Recuperar Contraseña' }}/>
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}

export default App;
