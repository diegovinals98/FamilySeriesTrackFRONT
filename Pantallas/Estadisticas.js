import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions, ScrollView, StyleSheet } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { useRoute } from '@react-navigation/native';

const windowWidth = Dimensions.get('window').width;

const Estadisticas = () => {
  const route = useRoute();
  const [idUsuario, setIdUsuario] = useState(route.params.idUsuario);
  const [capitulosPorSerie, setCapitulosPorSerie] = useState([]);
  const [nombresSeries, setNombresSeries] = useState([]); // Estado para los nombres de las series
  const [temporadasVistas, setTemporadasVistas] = useState(0);
  const [seriesVistas, setSeriesVistas] = useState([]);
  const apiKey = 'c51082efa7d62553e4c05812ebf6040e';

  useEffect(() => {
    obtenerCapitulosVistos();
    obtenerTemporadasVistas();
    obtenerSeriesVistas();
  }, []);

  useEffect(() => {
    if (capitulosPorSerie.length > 0) {
      obtenerNombresSeries(); // Llama para obtener nombres cuando hay datos de series
    }
  }, [capitulosPorSerie]);

  const obtenerCapitulosVistos = async () => {
    try {
      const response = await fetch(`https://apitfg.lapspartbox.com/capitulos-vistos/${idUsuario}`);
      const data = await response.json();
      setCapitulosPorSerie(data);
    } catch (error) {
      console.error('Error al obtener capítulos vistos:', error);
    }
  };

  const obtenerTemporadasVistas = async () => {
    try {
      const response = await fetch(`https://apitfg.lapspartbox.com/temporadas-vistas/${idUsuario}`);
      const data = await response.json();
      setTemporadasVistas(data.totalTemporadasVistas);
    } catch (error) {
      console.error('Error al obtener temporadas vistas:', error);
    }
  };

  const obtenerSeriesVistas = async () => {
    try {
      const response = await fetch(`https://apitfg.lapspartbox.com/series-vistas/${idUsuario}`);
      const data = await response.json();
      setSeriesVistas(data);
    } catch (error) {
      console.error('Error al obtener series vistas:', error);
    }
  };

  // Función para obtener los nombres de las series por sus IDs
  const obtenerNombreSerie = async (serieId) => {
    try {
      const response = await fetch(`https://api.themoviedb.org/3/tv/${serieId}?api_key=${apiKey}&language=es-ES`);
      const data = await response.json();
      return data.name; // El nombre de la serie
    } catch (error) {
      console.error('Error obteniendo nombre de serie:', error);
      return 'Nombre desconocido'; // En caso de error
    }
  };

  // Función para obtener los nombres de todas las series
  const obtenerNombresSeries = async () => {
    const nombres = await Promise.all(
      capitulosPorSerie.map(async (serie) => {
        const nombre = await obtenerNombreSerie(serie.serie); // Llama a la API de TMDb por cada serie
        return nombre;
      })
    );
    setNombresSeries(nombres); // Actualiza el estado con los nombres
  };

  // Si los nombres de las series aún no se han obtenido, muestra un texto de carga
  if (nombresSeries.length === 0) {
    return <Text style={styles.loadingText}>Cargando nombres de series...</Text>;
  }

  return (
    <ScrollView>
      <Text style={styles.title}>Tus estadísticas personales</Text>
      <View style={styles.container}>
        {/* Gráfico de Capítulos Vistos */}
        <Text style={styles.chartTitle}>Capítulos Vistos por Serie</Text>
        <BarChart
        style={styles.pieChartContainer}
          data={{
            labels: nombresSeries, // Usamos los nombres en lugar de los IDs
            datasets: [
              {
                data: capitulosPorSerie.map(serie => serie.capitulosVistos),
              }
            ]
          }}
          width={windowWidth - 16}
          height={300} // Reducimos la altura
          chartConfig={{
            backgroundColor: '#1cc910',
            backgroundGradientFrom: '#eff3ff',
            backgroundGradientTo: '#efefef',
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            strokeWidth: 2, // optional, default 3
            barPercentage: 0.5,
            propsForLabels: {
              fontSize: 10, // Reducimos el tamaño de las etiquetas
            },
          }}
          verticalLabelRotation={45} // Cambiamos la rotación para que las etiquetas se vean mejor
        />

        {/* Gráfico de Temporadas Vistas */}
        <Text style={styles.chartTitle}>Total de Temporadas Vistas</Text>
        <Text style={styles.subtitle}>{temporadasVistas}</Text>

        {/* Gráfico de Series Vistas */}
        <Text style={styles.chartTitle}>Series Vistas</Text>
        <PieChart
            style={styles.pieChartContainer}
          data={seriesVistas.map(serie => ({
            name: serie.serie,
            population: serie.temporadasVistas,
            color: '#' + Math.floor(Math.random() * 16777215).toString(16), // Genera colores aleatorios
            legendFontColor: '#7F7F7F',
            legendFontSize: 15
          }))}
          width={windowWidth - 16}
          height={220}
          chartConfig={{
            backgroundColor: '#1cc910',
            backgroundGradientFrom: '#eff3ff',
            backgroundGradientTo: '#efefef',
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>
    </ScrollView>
  );
};

export default Estadisticas;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff', // Fondo blanco para consistencia
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginVertical: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#4A90E2',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 15,
  },
  chartContainer: {
    width: windowWidth - 20,
    alignItems: 'center',
    marginVertical: 20,
  },
  pieChartContainer: {
    alignItems: 'center',
    marginVertical: 20,
    borderWidth: '2px',
    borderRadius: '10px'
  },
  pieChartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: windowWidth - 20,
  },
  seriesListContainer: {
    marginTop: 10,
    width: '100%',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  seriesItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  seriesName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  seriesStat: {
    fontSize: 14,
    color: '#7F7F7F',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A90E2',
    marginVertical: 10,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#4A90E2',
    marginVertical: 20,
    textAlign: 'center',
  },
  pieChartLegendText: {
    fontSize: 14,
    color: '#7F7F7F',
  },
});
