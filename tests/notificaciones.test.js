import { sendPushNotification } from '../src/Pantallas/notificaciones';

describe('Notificaciones', () => {
  beforeEach(() => {
    // Limpiar mocks antes de cada test
    fetch.mockClear();
  });

  test('envía notificación push correctamente', async () => {
    // Mock de respuesta exitosa
    fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'success' })
      })
    );

    const token = 'ExponentPushToken[xxx]';
    const title = 'Test Title';
    const body = 'Test Body';

    const response = await sendPushNotification(token, title, body);
    expect(response.status).toBe(200);
  });

  test('maneja errores en el envío de notificaciones', async () => {
    // Mock de respuesta con error
    fetch.mockImplementationOnce(() => 
      Promise.reject(new Error('Error al enviar notificación push'))
    );

    const token = 'invalid-token';
    const title = 'Test Title';
    const body = 'Test Body';

    await expect(sendPushNotification(token, title, body))
      .rejects
      .toThrow('Error al enviar notificación push');
  });
});
