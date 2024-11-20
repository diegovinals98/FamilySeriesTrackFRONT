import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../src/Pantallas/HomeScreen';
import { useUser } from '../src/userContext';

// Mock de los hooks y contextos necesarios
jest.mock('../src/userContext', () => ({
  useUser: jest.fn()
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn()
  }),
  useFocusEffect: jest.fn()
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    useUser.mockImplementation(() => ({
      user: {
        id: '1',
        nombre: 'Juan',
        apellidos: 'Pérez',
        idioma: 'es'
      },
      setUser: jest.fn()
    }));
  });

  test('renderiza las iniciales del usuario correctamente', () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText('JP')).toBeTruthy();
  });

  test('muestra el indicador de carga al inicio', () => {
    const { getByTestId } = render(<HomeScreen />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  test('permite buscar series', async () => {
    const { getByPlaceholderText, findByText } = render(<HomeScreen />);
    const searchInput = getByPlaceholderText('Buscar serie...');
    
    fireEvent.changeText(searchInput, 'Breaking Bad');
    
    await waitFor(() => {
      expect(findByText('Breaking Bad')).toBeTruthy();
    });
  });

  test('permite filtrar series por estado', async () => {
    const { getByText, findByText } = render(<HomeScreen />);
    const filtroButton = getByText('Todas');
    
    fireEvent.press(filtroButton);
    fireEvent.press(getByText('Viendo'));

    await waitFor(() => {
      expect(findByText('Series en curso')).toBeTruthy(); 
    });
  });

  test('permite navegar a detalles de serie', () => {
    const navigation = { navigate: jest.fn() };
    const { getByTestId } = render(<HomeScreen navigation={navigation} />);
    
    const serieCard = getByTestId('serie-card-1');
    fireEvent.press(serieCard);

    expect(navigation.navigate).toHaveBeenCalledWith('Detalles Serie', expect.any(Object));
  });

  test('muestra mensaje cuando no hay series', async () => {
    const { findByText } = render(<HomeScreen />);
    
    await waitFor(() => {
      expect(findByText('No hay series para mostrar')).toBeTruthy();
    });
  });

  test('permite refrescar la lista de series', async () => {
    const { getByTestId } = render(<HomeScreen />);
    const flatList = getByTestId('series-list');

    fireEvent.scroll(flatList, {
      nativeEvent: {
        contentOffset: { y: 0 },
        contentSize: { height: 500, width: 100 },
        layoutMeasurement: { height: 100, width: 100 }
      }
    });

    await waitFor(() => {
      expect(getByTestId('loading-indicator')).toBeTruthy();
    });
  });
});
