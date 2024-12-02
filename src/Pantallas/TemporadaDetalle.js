import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, useColorScheme, Modal } from 'react-native';
import { useUser } from '../userContext.js';
import { useFocusEffect } from '@react-navigation/native';
import { sendPushNotification } from './notificaciones.js';
import { WebView } from 'react-native-webview';

const DetallesDeTemporada = ({ route }) => {
  const [idSerie, setidSerie] = useState(route.params.idSerie);
  const [numeroTemporada, setnumeroTemporada] = useState(route.params.NumeroTemporada);
  const [nombreGrupo, setNombreGrupo] = useState(route.params.nombreGrupo);
  const [nombreSerie, setNombreSerie] = useState(route.params.nombreSerie);
  const [detallesTemporada, setDetallesTemporada] = useState(null);
  const [capitulosVistos, setCapitulosVistos] = useState([]);
  const [actualizarVisto, setActualizarVisto] = useState(false);
  const [miembrosGrupo, setMiembrosGrupo] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const { user } = useUser();
  let colorScheme = useColorScheme();

  const obtenerCapitulosVistos = async () => {
    try {
      const apiKey = 'c51082efa7d62553e4c05812ebf6040e';
      const url = `https://api.themoviedb.org/3/tv/${idSerie}/season/${numeroTemporada}?api_key=${apiKey}&language=${user.idioma}`;

      const response = await fetch(url);
      const data = await response.json();
      setDetallesTemporada(data);

      const url2 = `${global.API}/temporada-vista/${user.id}/${idSerie}/${data.season_number}`;
      const response2 = await fetch(url2);
      const data2 = await response2.json();

      setCapitulosVistos(data2.vistos);
    } catch (error) {
      console.error('Error al obtener detalles de la temporada: ', error);
    }
  };

  const obtenerMiembrosGrupo = async () => {
    try {
      const response = await fetch(`${global.API}/miembros-grupo/${nombreGrupo}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      setMiembrosGrupo(data);
      console.log('Miembros del grupo: ', data);
    } catch (error) {
      console.error('Error al obtener miembros del grupo: ', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      obtenerCapitulosVistos();
      obtenerMiembrosGrupo();
    }, [idSerie, numeroTemporada, actualizarVisto])
  );

  const marcarVisto = async (idSerie, capituloId, Name, Episode_number, season_number, userid) => {
    try {
      console.log("Marcando visto: ", idSerie, capituloId, Name, Episode_number, season_number, userid);
      console.log("API: ", `${global.API}/agregar-visualizacion`);
      const response = await fetch(`${global.API}/agregar-visualizacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idSerie, capituloId, Name, Episode_number, season_number, userid }),
      });

      console.log("Respuesta: ", response);

      if (!response.ok) {
        throw new Error('Error al agregar capitulo');
      }

      setActualizarVisto(actual => !actual);
     
      for (const miembro of miembrosGrupo.members) {
        if (miembro.id !== user.id) {
          try {
            const response = await fetch(`${global.API}/obtener-token/${miembro.id}`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
              throw new Error('Error al obtener los tokens del miembro');
            }
            const data = await response.json();
            const tokens = data.tokens;
            datosAEnviar = {
              tipo: 'visualizacion',
              idSerie: idSerie,
              nombreGrupo: nombreGrupo,
              nombreSerie: nombreSerie,
            }
            tokens.forEach(token => {
              console.log("Mandadndo al token: " + token);
              sendPushNotification(token, 'Capitulo visto!', user.nombre + ': Temporada ' + season_number + '. Capitulo ' + Episode_number, nombreGrupo + ": " + nombreSerie, datosAEnviar);
            });
          } catch (error) {
            console.error(`Error al obtener los tokens del miembro ${miembro.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error al agregar capitulo:', error);
    }
  };

  const eliminarVisto = async (capituloId, userid) => {
    try {
      const response = await fetch(`${global.API}/eliminar-visualizacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capituloId, userid }),
      });

      if (!response.ok) {
        throw new Error('Error al eliminar visualización');
      }

      setActualizarVisto(actual => !actual);
    } catch (error) {
      console.error('Error al eliminar visualización:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options).replace(/^\w/, (c) => c.toUpperCase());
  };

  const openEpisodeModal = (episode) => {
    setSelectedEpisode(episode);
    setModalVisible(true);
  };

  if (!detallesTemporada) {
    return (
      <View style={[styles.container, colorScheme === 'dark' && styles.darkContainer]}>
        <Text style={colorScheme === 'dark' ? styles.darkText : styles.lightText}>Cargando detalles de la temporada...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, colorScheme === 'dark' && styles.darkContainer]}>
      <Text style={[styles.title, colorScheme === 'dark' && styles.darkTitle]}>{detallesTemporada.name.toUpperCase()}</Text>
      <ScrollView style={styles.scrollView}>
        <View style={styles.episodesContainer}>
          {detallesTemporada.episodes && detallesTemporada.episodes.map((capitulo, index) => (
            <View key={capitulo.id} style={[styles.capituloContainer, colorScheme === 'dark' && styles.darkCapituloContainer]}>
              {capitulo.still_path && (
                <TouchableOpacity onPress={() => openEpisodeModal(capitulo)}>
                  <Image
                    source={{ uri: `https://image.tmdb.org/t/p/w500${capitulo.still_path}` }}
                    style={styles.capituloImage}
                  />
                </TouchableOpacity>
              )}
              <Text style={[styles.capituloTitle, colorScheme === 'dark' && styles.darkText]}>Capítulo {capitulo.episode_number}: {capitulo.name}</Text>
              <Text style={[styles.capituloDate, colorScheme === 'dark' && styles.darkText]}>{formatDate(capitulo.air_date)}</Text>
              <Text style={[styles.capituloDescription, colorScheme === 'dark' && styles.darkText]}>{capitulo.overview}</Text>
              {(capitulosVistos || []).includes(capitulo.id) ? (
                <TouchableOpacity
                  style={[styles.boton, styles.botonVisto]}
                  onPress={() => eliminarVisto(capitulo.id, user.id)}
                >
                  <Text style={styles.textoBoton}>Visto ✓</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.boton, styles.botonMarcarVisto]}
                  onPress={() => marcarVisto(idSerie, capitulo.id, capitulo.name, capitulo.episode_number, detallesTemporada.season_number, user.id)}
                >
                  <Text style={styles.textoBoton}>Marcar como visto</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {selectedEpisode && (
            <WebView
              source={{ uri: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${nombreSerie} S${detallesTemporada.season_number}E${selectedEpisode.episode_number} trailer`)}` }}
              style={styles.webView}
            />
          )}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: '10%',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  scrollView: {
    height: '100%',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    paddingTop: '2%',
    paddingBottom: '2%',
    textAlign: 'center',
    backgroundColor: '#4A90E2',
    color: 'white',
    borderRadius: 10,
    marginHorizontal: '5%',
    marginBottom: 10,
    elevation: 5,
  },
  darkTitle: {
    backgroundColor: '#1E3A5F',
  },
  episodesContainer: {
    paddingHorizontal: '5%',
  },
  capituloContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 15,
    elevation: 5,
  },
  darkCapituloContainer: {
    backgroundColor: '#2C2C2C',
  },
  capituloImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    borderRadius: 10,
    marginBottom: 10,
  },
  capituloTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  capituloDate: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
  },
  capituloDescription: {
    fontSize: 14,
    color: 'grey',
    textAlign: 'justify',
    marginBottom: 10,
  },
  boton: {
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  botonMarcarVisto: {
    backgroundColor: '#3498DB',
  },
  botonVisto: {
    backgroundColor: '#2ECC71',
  },
  textoBoton: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  lightText: {
    color: '#000',
  },
  darkText: {
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  webView: {
    width: '100%',
    height: '90%',
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#4A90E2',
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DetallesDeTemporada;
