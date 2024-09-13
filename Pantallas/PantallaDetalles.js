import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { useUser } from '../userContext.js'; 
import { useFocusEffect } from '@react-navigation/native';

const PantallaDeDetalles = ({ route, navigation }) => {
  const { idSerie, NombreGrupo } = route.params;
  const [detallesSerie, setDetallesSerie] = useState(null);
  const [UsuariosSerie, setUsuariosSerie] = useState([]);
  const [watchProvider, setWatchProvider] = useState(null); // Estado para almacenar un solo proveedor

  const { user } = useUser();

  const obtenerDetallesSerie = (idSerie) => {
    const apiKey = 'c51082efa7d62553e4c05812ebf6040e';
    const url = `https://api.themoviedb.org/3/tv/${idSerie}?api_key=${apiKey}&language=es-ES`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        setDetallesSerie(data);
      })
      .catch((error) => console.error('Error al obtener detalles de la serie:', error));
  };

  const obtenerWatchProviders = (idSerie) => {
    const apiKey = 'c51082efa7d62553e4c05812ebf6040e';
    const url = `https://api.themoviedb.org/3/tv/${idSerie}/watch/providers?api_key=${apiKey}`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (data.results && data.results.ES && data.results.ES.flatrate) {
          // Solo seleccionamos el primer proveedor disponible
          setWatchProvider(data.results.ES.flatrate[0]);
        }
      })
      .catch((error) => console.error('Error al obtener proveedores de visualización:', error));
  };

  const obtenerUsuariosViendoSerie = async (nombreGrupo, idSerie) => {
    try {
      const response = await fetch(`https://apitfg.lapspartbox.com/usuarios-viendo-serie/${nombreGrupo}/${idSerie}`);
      if (!response.ok) {
        throw new Error('Respuesta de red no fue ok.');
      }
      const data = await response.json();
      setUsuariosSerie(data);
    } catch (error) {
      console.error('Hubo un problema con la petición fetch:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      obtenerDetallesSerie(idSerie);
      obtenerUsuariosViendoSerie(NombreGrupo, idSerie);
      obtenerWatchProviders(idSerie); 
    }, [idSerie, NombreGrupo])
  );

  const poster = (path) => {
    if (!path) return null;
    let imagePath = { uri: `https://image.tmdb.org/t/p/w500${path}` };
    return <Image source={imagePath} style={styles.poster} />;
  };

  const posterSeason = (path) => {
    if (!path) return null;
    let imagePath = { uri: `https://image.tmdb.org/t/p/w500${path}` };
    return <Image source={imagePath} style={styles.posterSeason} />;
  };

  const navegarADetallesDeTemporada = (idSerie, NumeroTemporada, nombreGrupo, nombreSerie) => {
    navigation.navigate('Temporada', { idSerie, NumeroTemporada, nombreGrupo, nombreSerie });
  };

  const eliminarSerie = async (idSerie, userId) => {
    Alert.alert(
      'Confirmación',
      `¿Estás seguro de que quieres eliminar la serie: ${detallesSerie.name}?`,
      [
        {
          text: 'Sí',
          onPress: async () => {
            try {
              const response = await fetch('https://apitfg.lapspartbox.com/eliminar-serie-usuario', {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, idSerie }),
              });

              if (!response.ok) {
                throw new Error('Error al eliminar la serie');
              }

              navigation.navigate('Home');
            } catch (error) {
              console.error('Error al eliminar la serie:', error);
            }
          },
        },
        { text: 'No', style: 'cancel' },
      ],
      { cancelable: false }
    );
  };

  const irComentaros = (idSerie, NombreGrupo) => {
    navigation.navigate('Comentarios Serie', { idSerie, NombreGrupo, nombreSerie: detallesSerie.name });
  };

  // Función para abrir la aplicación de la plataforma de streaming
  const abrirAppPlataforma = () => {
    let appUrl;

    switch (watchProvider.provider_name) {
      case 'Netflix':
        appUrl = 'nflx://';
        break;
      case 'Disney Plus':
        appUrl = 'disneyplus://';
        break;
      case 'HBO Max':
        appUrl = 'hbomax://';
        break;
      case 'Amazon Prime Video':
        appUrl = 'primevideo://';
        break;
      default:
        appUrl = null;
    }

    if (appUrl) {
      Linking.openURL(appUrl).catch((err) => {
        console.error('No se puede abrir la app', err);
        Alert.alert('Error', 'No se pudo abrir la aplicación.');
      });
    } else {
      Alert.alert('Error', 'No hay una aplicación disponible para esta plataforma.');
    }
  };

  if (!detallesSerie) {
    return (
      <View style={styles.container}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {poster(detallesSerie.poster_path)}
      <Text style={styles.title}>{detallesSerie.name.toUpperCase()}</Text>

      <ScrollView>
        {/* Mostrar el proveedor de streaming */}
        {watchProvider && (
          <TouchableOpacity style={styles.providerContainer} onPress={abrirAppPlataforma}>
            <Image
              source={{ uri: `https://image.tmdb.org/t/p/w500${watchProvider.logo_path}` }}
              style={styles.providerLogo}
            />
            <Text style={styles.providerName}>{watchProvider.provider_name}</Text>
          </TouchableOpacity>
        )}

        {/* Tabla de usuarios */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <View style={styles.usuarioContainer}>
            <View style={styles.usuarioTextoContainer}>
              <Text style={styles.header}>USUARIO</Text>
              <Text style={styles.header}>TEMPORADA</Text>
              <Text style={styles.header}>CAPÍTULO</Text>
            </View>
            {UsuariosSerie.map((usuario, index) => (
              <View key={index} style={styles.usuarioTextoContainer}>
                <Text style={styles.usuarioTexto}>{usuario.Nombre}</Text>
                <Text style={styles.usuarioTexto}>{usuario.Temporada_Mas_Alta}</Text>
                <Text style={styles.usuarioTexto}>{usuario.Capitulo_Mas_Reciente}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Descripción de la serie */}
        <Text style={styles.detail}>{detallesSerie.overview}</Text>

        {/* Mostrar las temporadas */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {detallesSerie.seasons &&
            detallesSerie.seasons.map((season, index) => (
              <TouchableOpacity
                key={index}
                style={styles.serieDetailContainer}
                onPress={() => navegarADetallesDeTemporada(idSerie, season.season_number, NombreGrupo, detallesSerie.name)}
              >
                <View style={{ flex: 1, marginTop: 0 }}>
                  <Text key={index} style={styles.seasonTitle}>
                    {season.name}
                  </Text>
                  {posterSeason(season.poster_path)}
                </View>
              </TouchableOpacity>
            ))}
        </View>
      </ScrollView>

      <View style={{ flexDirection: 'row', marginRight: '1%', marginLeft: '1%' }}>
        <TouchableOpacity style={styles.eliminarSerieBoton} onPress={() => eliminarSerie(idSerie, user.id)}>
          <Text style={styles.eliminarSerieTexto}>Eliminar Serie</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.comentariosBoton} onPress={() => irComentaros(idSerie, NombreGrupo)}>
          <Text style={styles.eliminarSerieTexto}>Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: '2%',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#4A90E2',
    paddingVertical: 10,
    textAlign: 'center',
    width: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 10,
    elevation: 5,
  },
  detail: {
    fontSize: 16,
    color: 'grey',
    margin: '5%',
    textAlign: 'justify',
  },
  poster: {
    height: 250,
    width: '100%',
    resizeMode: 'contain',
    borderRadius: 10,
    marginBottom: 15,
  },
  posterSeason: {
    height: 150,
    resizeMode: 'contain',
    borderRadius: 10,
  },
  serieDetailContainer: {
    width: '33%',
    padding: 10,
  },
  eliminarSerieBoton: {
    backgroundColor: '#E74C3C',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
    elevation: 5,
  },
  comentariosBoton: {
    backgroundColor: '#3498DB',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
    elevation: 5,
  },
  eliminarSerieTexto: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  usuarioContainer: {
    flex: 1,
    marginHorizontal: '5%',
    marginBottom: 10,
  },
  usuarioTextoContainer: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  usuarioTexto: {
    flex: 1,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    padding: 5,
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flex: 1,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    padding: 5,
    backgroundColor: '#9ca3ad',
    color: 'white',
    fontWeight: 'bold',
    borderRadius: 5,
  },
  seasonTitle: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  providerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 5,
  },
  providerLogo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginRight: 10,
    borderRadius: 10
  },
  providerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
});

export default PantallaDeDetalles;
