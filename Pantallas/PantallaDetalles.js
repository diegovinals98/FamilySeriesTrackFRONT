import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, Linking, Share } from 'react-native';
import { useUser } from '../userContext.js'; 
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Rating } from 'react-native-elements';

const PantallaDeDetalles = ({ route, navigation }) => {
  const { idSerie, NombreGrupo } = route.params;
  const [detallesSerie, setDetallesSerie] = useState(null);
  const [UsuariosSerie, setUsuariosSerie] = useState([]);
  const [watchProviders, setWatchProviders] = useState([]);
  const [rating, setRating] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const { user } = useUser();

  const obtenerDetallesSerie = (idSerie) => {
    const apiKey = 'c51082efa7d62553e4c05812ebf6040e';
    const url = `https://api.themoviedb.org/3/tv/${idSerie}?api_key=${apiKey}&language=es-ES`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        setDetallesSerie(data);
        setRating(data.vote_average / 2); // Convertir a escala de 5 estrellas
        navigation.setParams({ nombreSerie: data.name });
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
          setWatchProviders(data.results.ES.flatrate);
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
    return <Image source={imagePath} style={styles.posterImage} />;
  };

  const posterSeason = (path) => {
    if (!path) return null;
    let imagePath = { uri: `https://image.tmdb.org/t/p/w500${path}` };
    return <Image source={imagePath} style={styles.posterSeasonImage} />;
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

  const abrirAppPlataforma = (providerName) => {
    let appUrl;

    switch (providerName) {
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

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Aquí puedes agregar la lógica para guardar el estado de favorito en el backend
  };

  const compartirSerie = async () => {
    try {
      const result = await Share.share({
        message: `¡Mira esta serie genial: ${detallesSerie.name}!`,
        title: detallesSerie.name,
        url: `https://www.themoviedb.org/tv/${idSerie}`,
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error) {
      Alert.alert(error.message);
    }
  };

  const navegarAInfo = (idSerie) => {
    console.log("idSerie", idSerie);
    navigation.navigate('Serie', { serieData: idSerie  });
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
      <Text style={styles.titleText}>{detallesSerie.name.toUpperCase()}</Text>

      <ScrollView>
        
        {watchProviders.length > 0 && (
          <View style={styles.providersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {watchProviders.map((provider, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.providerItem} 
                  onPress={() => abrirAppPlataforma(provider.provider_name)}
                >
                  <Image
                    source={{ uri: `https://image.tmdb.org/t/p/w500${provider.logo_path}` }}
                    style={styles.providerLogo}
                  />
                  <Text style={styles.providerName}>{provider.provider_name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={styles.headerCell}>USUARIO</Text>
            <Text style={styles.headerCell}>TEMPORADA</Text>
            <Text style={styles.headerCell}>CAPÍTULO</Text>
          </View>
          {UsuariosSerie.map((usuario, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCell}>{usuario.Nombre}</Text>
              <Text style={styles.tableCell}>{usuario.Temporada_Mas_Alta}</Text>
              <Text style={styles.tableCell}>{usuario.Capitulo_Mas_Reciente}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.overviewText}>{detallesSerie.overview}</Text>

        <View style={styles.seasonsContainer}>
          {detallesSerie.seasons &&
            detallesSerie.seasons.map((season, index) => (
              <TouchableOpacity
                key={index}
                style={styles.seasonItem}
                onPress={() => navegarADetallesDeTemporada(idSerie, season.season_number, NombreGrupo, detallesSerie.name)}
              >
                <View style={styles.seasonContent}>
                  <Text key={index} style={styles.seasonTitle}>
                    {season.name}
                  </Text>
                  {posterSeason(season.poster_path)}
                </View>
              </TouchableOpacity>
            ))}
        </View>
        <View style={styles.actionContainer}>
          <TouchableOpacity onPress={toggleFavorite} style={styles.actionButton}>
            <Icon name={isFavorite ? 'heart' : 'heart-o'} size={24} color={isFavorite ? 'red' : 'black'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={compartirSerie} style={styles.actionButton}>
            <Icon name="share" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.deleteButton} onPress={() => eliminarSerie(idSerie, user.id)}>
          <Text style={styles.buttonText}>Eliminar Serie</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chatButton} onPress={() => irComentaros(idSerie, NombreGrupo)}>
          <Text style={styles.buttonText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.infoButton} onPress={() => navegarAInfo(idSerie)}>
          <Text style={styles.buttonText}>Información</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    padding: 10,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatButton: {
    alignItems: 'center',
    backgroundColor: '#3498DB',
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    padding: 10,
  },
  container: {
    alignItems: 'center',
    flex: 1,
    padding: '2%',
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: '#E74C3C',
    borderRadius: 5,
    elevation: 5,
    flex: 1,
    marginHorizontal: 5,
    padding: 10,
  },
  headerCell: {
    color: 'white',
    flex: 1,
    fontWeight: 'bold',
    padding: 10,
    textAlign: 'center',
  },
  infoButton: {
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    borderRadius: 5,
    justifyContent: 'center',
  },
  overviewText: {
    color: 'grey',
    fontSize: 16,
    margin: '5%',
    textAlign: 'justify',
  },
  posterImage: {
    borderRadius: 10,
    height: 250,
    marginBottom: 15,
    resizeMode: 'contain',
    width: '100%',
  },
  posterSeasonImage: {
    borderRadius: 10,
    height: 150,
    resizeMode: 'contain',
  },
  providersContainer: {
    marginBottom: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#4A90E2',
  },
  providerItem: {
    alignItems: 'center',
    marginRight: 15,
  },
  providerLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  providerName: {
    marginTop: 5,
    fontSize: 12,
    textAlign: 'center',
  },
  ratingContainer: {
    paddingVertical: 10,
  },
  seasonContent: {
    flex: 1,
    marginTop: 0,
  },
  seasonItem: {
    padding: 10,
    width: '33%',
  },
  seasonTitle: {
    color: '#4A90E2',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  seasonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tableCell: {
    flex: 1,
    padding: 10,
    textAlign: 'center',
  },
  tableContainer: {
    borderColor: '#ddd',
    borderRadius: 5,
    borderWidth: 1,
    marginBottom: 10,
    marginHorizontal: '5%',
    overflow: 'hidden',
  },
  tableHeader: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
  },
  tableRow: {
    borderColor: '#ddd',
    borderTopWidth: 1,
    flexDirection: 'row',
  },
  titleText: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    color: '#4A90E2',
    elevation: 5,
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingVertical: 10,
    textAlign: 'center',
    width: '100%',
  },
});

export default PantallaDeDetalles;
