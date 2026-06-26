# SMARTCARE — App GPS Android

App mobile React Native (Expo) per il tracking GPS del paziente.
Invia la posizione al backend ogni 10 secondi e mostra la dashboard vitali.

## Stack tecnologico

- **Expo SDK 54** — framework React Native
- **expo-location** — accesso GPS del dispositivo
- **Axios** — chiamate REST API al backend

## Funzionalità

- Acquisizione posizione GPS ad alta precisione ogni 10 secondi
- Invio coordinate al backend tramite REST API autenticata con JWT
- Dashboard vitali in tempo reale (BPM, HRV, Temperatura, Anomaly score)
- Attività giornaliera (passi, distanza, calorie)
- Storico BPM con grafico a barre
- Lista alert recenti (warning e critical)

## Setup

```bash
# Installa dipendenze
npm install

# Avvia con Expo
npx expo start
```

Poi scansiona il QR code con **Expo Go** (SDK 54) dal Play Store.

## Configurazione (App.js)

```javascript
const BACKEND_URL = 'http://192.168.0.104:3000'  // IP del PC con backend
const PATIENT_ID  = 'PAZ-001'                     // ID del paziente
const TOKEN       = 'jwt_token_del_paziente'       // Token JWT dal login
const INTERVAL_MS = 10000                          // Intervallo invio GPS (ms)
```

## Permessi richiesti

- **Localizzazione** — per accedere al GPS del dispositivo

## Note

- L'app e il backend devono essere sulla stessa rete WiFi
- Il token JWT va aggiornato ogni 7 giorni (durata token)
- Expo Go deve essere versione SDK 54 per compatibilità