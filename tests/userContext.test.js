import { renderHook, act } from '@testing-library/react-hooks';
import { useUser, UserProvider } from '../src/userContext';

describe('UserContext', () => {
  test('proporciona el estado inicial del usuario correctamente', () => {
    const { result } = renderHook(() => useUser(), {
      wrapper: UserProvider
    });

    expect(result.current.user).toBeNull();
  });

  test('actualiza el usuario correctamente', () => {
    const { result } = renderHook(() => useUser(), {
      wrapper: UserProvider
    });

    act(() => {
      result.current.setUser({
        id: '1',
        nombre: 'Juan',
        apellidos: 'Pérez'
      });
    });

    expect(result.current.user).toEqual({
      id: '1',
      nombre: 'Juan',
      apellidos: 'Pérez'
    });
  });
});