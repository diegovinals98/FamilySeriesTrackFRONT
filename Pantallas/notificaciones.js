// Con esta funcion se pueden enviar notificaciones push a los dispositivos
async function sendPushNotification(expoPushToken, titulo, body, subtitulo = '', subirBadge = false) {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: titulo,
      body: body,
      data: { someData: 'goes here' },
    };

    if (subtitulo) {
      message.subtitle = subtitulo;
    }

    if (subirBadge) {
      message.badge = 1;
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