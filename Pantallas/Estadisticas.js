import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

const Estadisticas = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [idUsuario, setIdUsuario] = useState(route.params.idUsuario);
  const [capitulosPorSerie, setCapitulosPorSerie] = useState([]);
  const [seriesData, setSeriesData] = useState([]);
  const [temporadasVistas, setTemporadasVistas] = useState(0);
  const [seriesVistas, setSeriesVistas] = useState([]);
  const [totalCapitulosVistos, setTotalCapitulosVistos] = useState(0);
  const [serieMasVista, setSerieMasVista] = useState(null);
  const [loading, setLoading] = useState(true);
  const apiKey = 'c51082efa7d62553e4c05812ebf6040e';
  const baseImageUrl = 'https://image.tmdb.org/t/p/w92';

  useEffect(() => {
    obtenerCapitulosVistos();
    obtenerTemporadasVistas();
    obtenerSeriesVistas();
  }, []);

  useEffect(() => {
    if (capitulosPorSerie.length > 0) {
      obtenerSeriesData();
      calcularTotalCapitulosVistos();
      determinarSerieMasVista();
    }
  }, [capitulosPorSerie]);

  const obtenerCapitulosVistos = async () => {
    try {
      const response = await fetch(`https://backendapi.familyseriestrack.com/capitulos-vistos/${idUsuario}`);
      const data = await response.json();
      setCapitulosPorSerie(data);
    } catch (error) {
      console.error('Error al obtener capítulos vistos:', error);
    }
  };

  const obtenerTemporadasVistas = async () => {
    try {
      const response = await fetch(`https://backendapi.familyseriestrack.com/temporadas-vistas/${idUsuario}`);
      const data = await response.json();
      setTemporadasVistas(data.totalTemporadasVistas);
    } catch (error) {
      console.error('Error al obtener temporadas vistas:', error);
    }
  };

  const obtenerSeriesVistas = async () => {
    try {
      const response = await fetch(`https://backendapi.familyseriestrack.com/series-vistas/${idUsuario}`);
      const data = await response.json();
      setSeriesVistas(data);
    } catch (error) {
      console.error('Error al obtener series vistas:', error);
    }
  };

  const obtenerSerieData = async (serieId) => {
    try {
      const response = await fetch(`https://api.themoviedb.org/3/tv/${serieId}?api_key=${apiKey}&language=es-ES`);
      const data = await response.json();
      return { id: serieId, name: data.name, posterPath: data.poster_path };
    } catch (error) {
      console.error('Error obteniendo nombre y póster de serie:', error);
      return { id: serieId, name: 'Nombre desconocido', posterPath: null };
    }
  };

  const obtenerSeriesData = async () => {
    const seriesInfo = await Promise.all(
      capitulosPorSerie.map(async (serie) => {
        const data = await obtenerSerieData(serie.serie);
        return data;
      })
    );
    setSeriesData(seriesInfo);
    setLoading(false);
  };

  const calcularTotalCapitulosVistos = () => {
    const total = capitulosPorSerie.reduce((acc, serie) => acc + serie.capitulosVistos, 0);
    setTotalCapitulosVistos(total);
  };

  const determinarSerieMasVista = () => {
    if (capitulosPorSerie.length > 0) {
      const serieMasVistos = capitulosPorSerie.reduce((prev, current) => 
        (prev.capitulosVistos > current.capitulosVistos) ? prev : current
      );
      setSerieMasVista(serieMasVistos);
    }
  };

  const navegarADetalleSerie = (serieId) => {
    navigation.navigate('Serie', { serieData:  serieId  });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1F8EFA" />
        <Text style={styles.loadingText}>Cargando estadísticas...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Tus estadísticas</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Capítulos Vistos</Text>
        {capitulosPorSerie.map((serie, index) => (
          <TouchableOpacity key={index} onPress={() => navegarADetalleSerie(serie.serie)} style={styles.listItem}>
            {seriesData[index]?.posterPath && (
              <Image
                source={{ uri: `${baseImageUrl}${seriesData[index].posterPath}` }}
                style={styles.poster}
              />
            )}
            <Text style={styles.seriesName}>{seriesData[index]?.name}</Text>
            <Text style={styles.seriesStat}>{serie.capitulosVistos} capítulos</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Total de capítulos vistos</Text>
        <Text style={styles.totalStat}>{totalCapitulosVistos}</Text>
      </View>

      {serieMasVista && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Serie más vista</Text>
          <Text style={styles.totalStat}>
            {seriesData.find(serie => serie.id === serieMasVista.serie)?.name}: {serieMasVista.capitulosVistos} capítulos
          </Text>
        </View>
      )}


      {/* TODO: Añadir estadísticas de temporadas vistas */}
      
      {/* <View style={styles.section}>
        <Text style={styles.sectionTitle}>Total de Temporadas Vistas</Text>
        <Text style={styles.totalStat}>{temporadasVistas}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Series Vistas</Text>
        {seriesVistas.map((serie, index) => (
          <TouchableOpacity key={index} onPress={() => navegarADetalleSerie(serie.serie)} style={styles.listItem}>
            <Text style={styles.seriesName}>{serie.serie}:</Text>
            <Text style={styles.seriesStat}>{serie.temporadasVistas} temporadas</Text>
          </TouchableOpacity>
        ))}
      </View> */}
    </ScrollView>
  );
};

export default Estadisticas;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#F4F6F8',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginVertical: 20,
  },
  section: {
    marginVertical: 20,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#555',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  poster: {
    width: 50,
    height: 75,
    marginRight: 15,
    borderRadius: 8,
  },
  seriesName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  seriesStat: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F8EFA',
  },
  totalStat: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F8EFA',
    textAlign: 'center',
    marginVertical: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F6F8',
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
    marginTop: 10,
  },
});
