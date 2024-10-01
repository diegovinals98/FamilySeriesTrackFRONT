import * as React from 'react';
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

const Stack = createNativeStackNavigator();

function App() {
  let colorScheme = useColorScheme();

  return (
    <UserProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="welcome"
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
          <Stack.Screen name="Añadir Grupo" options={{ title: 'Crear Grupo' }} component={AnadirGrupo} />
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
          <Stack.Screen name="Comentarios Serie" options={{ title: 'Chat' }} component={ComentariosSerie} />
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
