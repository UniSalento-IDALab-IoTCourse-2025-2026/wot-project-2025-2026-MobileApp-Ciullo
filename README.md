# SMARTCARE — App Smartphone (GPS)

## Descrizione del progetto
SMARTCARE è un sistema intelligente EDGE per la raccolta di parametri biomedici
e il rilevamento di anomalie in pazienti affetti da scompenso cardiaco.
Il sistema acquisisce segnali biomedici reali tramite macchinario IIT,
esegue anomaly detection in edge su Raspberry Pi con Isolation Forest,
e notifica automaticamente il medico e il hub del pronto soccorso
in caso di eventi critici, includendo la posizione GPS del paziente.

## Architettura del sistema
1. **Macchinario IIT + Dongle** — acquisisce segnali biomedici reali via BLE
2. **Raspberry Pi (edge node)** — anomaly detection con Isolation Forest
3. **App smartphone** — risponde con posizione GPS su richiesta del Raspberry
4. **Backend** — MQTT, MongoDB, REST API, alert engine
5. **Dashboard paziente + Dashboard medico** — due web app React separate

## Repository delle componenti
da aggiungere

## Questa componente — App Smartphone
App React Native minimale che espone un endpoint HTTP locale.
Quando il Raspberry Pi rileva un'anomalia, invia una richiesta HTTP
all'app che risponde con le coordinate GPS del paziente.

### Funzionalità
- Endpoint HTTP che risponde con latitudine e longitudine
- Acquisizione GPS tramite expo-location
- Attivata solo su richiesta, non in background continuo

### Tecnologie utilizzate
- Framework: React Native + Expo
- GPS: expo-location
- Comunicazione: HTTP server locale
