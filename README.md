# FAMILY SERIES TRACK

## Descripción
FamilySeriesTrack es una aplicación desarrollada para el seguimiento de series. Esta aplicación permite a los usuarios llevar un registro de las series que están viendo, las que han completado, y descubrir nuevas series para ver. Además, ofrece funcionalidades para gestionar grupos, ver calendarios de emisión y personalizar la experiencia del usuario.

## Estructura de Directorios
- `assets`: Archivos estáticos como imágenes, fuentes, etc., utilizados en la aplicación.
- `Pantallas`: Contiene las diferentes pantallas de la aplicación:
  - `AnadirGrupo.js`: Pantalla para añadir nuevos grupos.
  - `Calendario.js`: Muestra los episodios programados de series de televisión.
  - `ComentariosSerie.js`: Pantalla para ver y añadir comentarios sobre una serie.
  - `Estadisticas.js`: Muestra estadísticas relacionadas con las series y el uso de la aplicación.
  - `HomeScreen.js`: La pantalla principal de la aplicación.
  - `LogInScreen.js`: Pantalla para el inicio de sesión de usuarios.
  - `notificaciones.js`: Maneja las notificaciones de la aplicación.
  - `PantallaDetalles.js`: Muestra información detallada de series o episodios.
  - `RecuperarContrasena.js`: Pantalla para recuperar la contraseña del usuario.
  - `RecuperarContrasena2.js`: Segunda pantalla en el proceso de recuperación de contraseña.
  - `serie.js`: Pantalla que muestra detalles específicos de una serie.
  - `Settings.js`: Pantalla de ajustes de la aplicación.
  - `SignUp.js`: Pantalla para el registro de nuevos usuarios.
  - `TemporadaDetalle.js`: Muestra detalles de una temporada específica.
  - `Welcome.js`: Pantalla de bienvenida para usuarios nuevos o que regresan.

## Archivos Principales
- `.gitignore`: Especifica archivos que Git debe ignorar.
- `App.js`: Punto de entrada principal de la aplicación.
- `app.json`: Archivo de configuración de la aplicación.
- `babel.config.js`: Configuración para Babel, el compilador de JavaScript.
- `eas.json`: Configuración para los Servicios de Aplicaciones de Expo.
- `estilosGlobales.js`: Contiene estilos globales para la aplicación.
- `index.js`: Posible punto de entrada alternativo o componente raíz.
- `metro.config.js`: Configuración para Metro, el empaquetador de JavaScript para React Native.
- `package-lock.json`: Archivo generado automáticamente para gestión de dependencias.
- `package.json`: Lista de dependencias y scripts del proyecto.
- `README.md`: Este archivo, con instrucciones y detalles del proyecto.
- `userContext.js`: Maneja el estado del usuario en la aplicación.

## Configuración y Uso

Para ejecutar este proyecto localmente, sigue estos pasos:

1. Clona este repositorio:
   ```
   git clone [URL_DEL_REPOSITORIO]
   ```
2. Instala [Node.js](https://nodejs.org/) si aún no lo tienes.
3. Instala Expo CLI globalmente:
   ```
   npm install -g expo-cli
   ```
4. Navega al directorio del proyecto:
   ```
   cd FamilySeriesTrackFRONT
   ```
5. Instala las dependencias del proyecto:
   ```
   npm install
   ```
6. Inicia el servidor de desarrollo:
   ```
   npx expo start
   ```

## Características Principales
- Seguimiento de series vistas y por ver
- Gestión de grupos para compartir series con amigos y familia
- Calendario de emisiones de episodios
- Detalles completos de series y temporadas
- Sistema de autenticación de usuarios
- Interfaz personalizable a través de ajustes

## Tecnologías Utilizadas
- React Native
- Expo
- JavaScript/ES6+
- Otros (especificar librerías adicionales si se conocen)

## Contribución
Si deseas contribuir al proyecto, por favor:
1. Haz un fork del repositorio
2. Crea una nueva rama (`git checkout -b feature/AmazingFeature`)
3. Realiza tus cambios y haz commit (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia
[Especificar la licencia bajo la cual se distribuye el proyecto]

## Contacto
[Proporcionar información de contacto o enlaces a perfiles relevantes]
