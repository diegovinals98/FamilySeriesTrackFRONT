import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useUser } from '../userContext.js'; // Importa el contexto del usuario.
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

const DetallesDeTemporada = ({ route }) => {
  const [idSerie, setidSerie] = useState(route.params.idSerie);
  const [numeroTemporada, setnumeroTemporada] = useState(route.params.NumeroTemporada);
  const [nombreGrupo, setNombreGrupo] = useState(route.params.nombreGrupo);
  const [nombreSerie, setNombreSerie] = useState(route.params.nombreSerie);
  const [detallesTemporada, setDetallesTemporada] = useState(null);
  const [capitulosVistos, setCapitulosVistos] = useState([]);
  const [actualizarVisto, setActualizarVisto] = useState(false);

  const { user } = useUser();

  const obtenerCapitulosVistos = async () => {
    try {
      const apiKey = 'c51082efa7d62553e4c05812ebf6040e';
      const url = `https://api.themoviedb.org/3/tv/${idSerie}/season/${numeroTemporada}?api_key=${apiKey}&language=es-ES`;

      const response = await fetch(url);
      const data = await response.json();
      setDetallesTemporada(data);

      const url2 = `https://apitfg.lapspartbox.com/temporada-vista/${user.id}/${idSerie}/${data.season_number}`;
      const response2 = await fetch(url2);
      const data2 = await response2.json();

      setCapitulosVistos(data2.vistos);
    } catch (error) {
      console.error('Error al obtener detalles de la temporada: ', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      obtenerCapitulosVistos();
    }, [idSerie, numeroTemporada, actualizarVisto])
  );

  const enviarNotificacion = async (mensaje) => {
    console.log('Enviando notificación:', mensaje);
    try {
      // Obtener los miembros del grupo
      const response = await fetch(`https://apitfg.lapspartbox.com/miembros-grupo/${nombreGrupo}`);
      const data = await response.json();
      const miembros = data.members;

      // Enviar notificación a cada miembro del grupo
      for (const miembro of miembros) {
        if (miembro.id !== user.id) { // No enviar notificación al usuario actual
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Actualización de serie',
              body: mensaje,
            },
            trigger: null,
            identifier: `notification-${miembro.id}-${Date.now()}`, // Identificador único
          });
        }
      }
      console.log('Notificación enviada con éxito');
    } catch (error) {
      console.error('Error al enviar notificación:', error);
    }
  };

  const marcarVisto = async (idSerie, capituloId, Name, Episode_number, season_number, userid) => {
    try {
      const response = await fetch('https://apitfg.lapspartbox.com/agregar-visualizacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idSerie, capituloId, Name, Episode_number, season_number, userid }),
      });

      if (!response.ok) {
        throw new Error('Error al agregar capitulo');
      }

      // Actualiza el estado para refrescar la lista de capítulos vistos
      setActualizarVisto(actual => !actual);

      // Envía notificación
      const mensaje = `${user.nombre} ha visto el capítulo ${Episode_number} de la temporada ${season_number} de ${nombreSerie}`;
      await enviarNotificacion(mensaje);
    } catch (error) {
      console.error('Error al agregar capitulo:', error);
    }
  };

  const eliminarVisto = async (capituloId, userid) => {
    try {
      const response = await fetch('https://apitfg.lapspartbox.com/eliminar-visualizacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capituloId, userid }),
      });

      if (!response.ok) {
        throw new Error('Error al eliminar visualización');
      }

      // Actualiza el estado para refrescar la lista de capítulos no vistos
      setActualizarVisto(actual => !actual);
    } catch (error) {
      console.error('Error al eliminar visualización:', error);
    }
  };

  if (!detallesTemporada) {
    return (
      <View style={styles.container}>
        <Text>Cargando detalles de la temporada...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{detallesTemporada.name.toUpperCase()}</Text>
      <ScrollView style={styles.scrollView}>
        <View style={styles.episodesContainer}>
          {detallesTemporada.episodes && detallesTemporada.episodes.map((capitulo, index) => (
            <View key={capitulo.id} style={styles.capituloContainer}>
              {capitulo.still_path && (
                <Image
                  source={{ uri: `https://image.tmdb.org/t/p/w500${capitulo.still_path}` }}
                  style={styles.capituloImage}
                />
              )}
              <Text style={styles.capituloTitle}>Capítulo {capitulo.episode_number}: {capitulo.name}</Text>
              <Text style={styles.capituloDescription}>{capitulo.overview}</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: '10%',
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
  episodesContainer: {
    paddingHorizontal: '5%',
  },
  capituloContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 15,
    elevation: 5,
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
});

export default DetallesDeTemporada;
