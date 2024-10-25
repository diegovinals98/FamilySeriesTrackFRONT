// Con esta funcion se pueden enviar notificaciones push a los dispositivos (iOS y Android)
async function sendPushNotification(expoPushToken, titulo, body, subtitulo = '', data = null) {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: titulo,
      body: body,
      badgeCount: (message.badgeCount || 0) + 1,
      android: {
        sound: 'default',
        priority: 'high',
        channelId: 'default',
      },
    };

    if (subtitulo) {
      message.subtitle = subtitulo;
      message.android.subtitle = subtitulo;
    }


    if (data) {
      message.data = data;
    }
  
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
}

export { sendPushNotification };