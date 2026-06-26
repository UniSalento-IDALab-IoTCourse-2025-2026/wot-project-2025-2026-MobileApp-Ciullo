import { useEffect, useState, useRef } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native'
import * as Location from 'expo-location'
import axios from 'axios'

const BACKEND_URL = 'http://192.168.0.102:3000'
const PATIENT_ID  = 'PAZ-001'
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMzk1YjkwZWQ1NGFiN2UzNWNlYTdlNiIsInJ1b2xvIjoicGF6aWVudGUiLCJpYXQiOjE3ODI0NjkzNjUsImV4cCI6MTc4MzA3NDE2NX0.tXux2jD4c2cQFxbPVRc0Mu14WTko2CwXm4nWMxLDirk'
const INTERVAL_MS = 10000

const SEV_COLORS = {
  normal:   { bg: '#085041', text: '#9FE1CB', label: 'Normale' },
  warning:  { bg: '#854F0B', text: '#FAC775', label: 'Attenzione' },
  critical: { bg: '#7A1F1F', text: '#F09595', label: 'Critico' },
}

const ALERT_COLORS = {
  warning:  { bg: '#2a1a00', text: '#FAC775' },
  critical: { bg: '#2a0000', text: '#F09595' },
}

function postura(imu) {
  if (!imu) return '—'
  if (Math.abs(imu.az) > 500) return 'Possibile caduta'
  if (imu.az > 800)  return 'In piedi'
  if (imu.az > 400)  return 'Seduto'
  return 'Sdraiato / in movimento'
}

export default function App() {
  const [latest, setLatest]   = useState(null)
  const [history, setHistory] = useState([])
  const [alerts, setAlerts]   = useState([])
  const [coords, setCoords]   = useState(null)
  const [lastUpd, setLastUpd] = useState('—')
  const [gpsCount, setGpsCount] = useState(0)
  const intervalRef = useRef(null)
  const gpsRef      = useRef(null)

  // Fetch vitali dal backend
  const fetchVitali = async () => {
    try {
      const [l, h, a] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/vitals/${PATIENT_ID}/latest`),
        axios.get(`${BACKEND_URL}/api/vitals/${PATIENT_ID}`),
        axios.get(`${BACKEND_URL}/api/alerts/${PATIENT_ID}`),
      ])
      setLatest(l.data)
      setHistory(h.data.reverse().slice(-20))
      setAlerts(a.data)
      setLastUpd(new Date().toLocaleTimeString())
    } catch (e) {
      console.error('Errore fetch vitali:', e.message)
    }
  }

  // Invia GPS al backend
  const avviaGPS = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permesso negato', 'Serve il permesso GPS')
      return
    }
    gpsRef.current = setInterval(async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
        const { latitude, longitude } = loc.coords
        setCoords({ lat: latitude, lng: longitude })
        await axios.post(
          `${BACKEND_URL}/api/patients/gps/${PATIENT_ID}`,
          { lat: latitude, lng: longitude },
          { headers: { Authorization: `Bearer ${TOKEN}` } }
        )
        setGpsCount(c => c + 1)
      } catch (e) {
        console.error('Errore GPS:', e.message)
      }
    }, INTERVAL_MS)
  }

  useEffect(() => {
    fetchVitali()
    avviaGPS()
    intervalRef.current = setInterval(fetchVitali, INTERVAL_MS)
    return () => {
      clearInterval(intervalRef.current)
      clearInterval(gpsRef.current)
    }
  }, [])

  const sev    = latest?.anomaly?.severity || 'normal'
  const sc     = SEV_COLORS[sev] || SEV_COLORS.normal
  const imu    = latest?.imu
  const post   = postura(imu)
  const passi  = latest?.passi_oggi ?? 0
  const perc   = Math.min(Math.round((passi / 5000) * 100), 100)
  const dist   = (passi * 0.00075).toFixed(1)
  const kcal   = Math.round(passi * 0.055)

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      {/* HEADER */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>SMARTCARE</Text>
          <Text style={s.sub}>PAZ-001 · {lastUpd}</Text>
        </View>
        <View style={[s.badge, { backgroundColor: sc.bg }]}>
          <Text style={[s.badgeText, { color: sc.text }]}>{sc.label}</Text>
        </View>
      </View>

      {/* VITALI */}
      <View style={s.box}>
        <Text style={s.boxTitle}>Vitali attuali</Text>
        <View style={s.grid2}>
          {[
            { label: 'Freq. cardiaca', val: latest?.bpm ? Math.round(latest.bpm) : '—', unit: ' bpm', accent: '#EF9F27' },
            { label: 'HRV',            val: latest?.hrv_ms ? Math.round(latest.hrv_ms) : '—', unit: ' ms', accent: '#1D9E75' },
            { label: 'Temperatura',    val: latest?.temp_c ? latest.temp_c.toFixed(1) : '—', unit: '°C',  accent: '#1D9E75' },
            { label: 'Anomaly score',  val: latest?.ecg_analysis?.anomaly_ratio?.toFixed(2) ?? '—', unit: '/1', accent: '#378ADD' },
          ].map(m => (
            <View key={m.label} style={[s.metric, { borderLeftColor: m.accent }]}>
              <Text style={s.metricLabel}>{m.label}</Text>
              <Text style={s.metricVal}>{m.val}<Text style={s.metricUnit}>{m.unit}</Text></Text>
            </View>
          ))}
        </View>
        <View style={s.posturaRow}>
          <Text style={s.posturaLabel}>Postura:</Text>
          <View style={[s.badge, { backgroundColor: '#085041' }]}>
            <Text style={[s.badgeText, { color: '#9FE1CB' }]}>{post}</Text>
          </View>
        </View>
      </View>

      {/* ATTIVITÀ */}
      <View style={s.box}>
        <Text style={s.boxTitle}>Attività giornaliera</Text>
        <Text style={s.passiVal}>{passi.toLocaleString()} <Text style={s.passiUnit}>passi</Text></Text>
        <Text style={s.sub}>Obiettivo: 5.000 passi</Text>
        <View style={s.barBg}>
          <View style={[s.barFill, { width: `${perc}%` }]} />
        </View>
        <Text style={[s.sub, { textAlign: 'right', marginBottom: 8 }]}>{perc}%</Text>
        <View style={s.grid2}>
          <View style={s.metric}>
            <Text style={s.metricLabel}>Distanza</Text>
            <Text style={s.metricVal}>{dist}<Text style={s.metricUnit}> km</Text></Text>
          </View>
          <View style={s.metric}>
            <Text style={s.metricLabel}>Calorie</Text>
            <Text style={s.metricVal}>{kcal}<Text style={s.metricUnit}> kcal</Text></Text>
          </View>
        </View>
      </View>

      {/* GPS */}
      <View style={s.box}>
        <Text style={s.boxTitle}>Posizione GPS</Text>
        {coords ? (
          <>
            <Text style={s.gpsVal}>{coords.lat.toFixed(5)}° N</Text>
            <Text style={s.gpsVal}>{coords.lng.toFixed(5)}° E</Text>
            <Text style={s.sub}>Invii GPS: {gpsCount}</Text>
          </>
        ) : (
          <Text style={s.sub}>In attesa del segnale GPS...</Text>
        )}
      </View>

      {/* STORICO BPM */}
      <View style={s.box}>
        <Text style={s.boxTitle}>Storico BPM — ultimi {history.length} valori</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={s.bpmList}>
            {history.map((h, i) => (
              <View key={i} style={s.bpmItem}>
                <View style={[s.bpmBar, {
                  height: Math.max(4, ((h.bpm - 30) / 130) * 80),
                  backgroundColor: h.bpm > 100 ? '#E24B4A' : h.bpm < 50 ? '#E24B4A' : '#378ADD'
                }]} />
                <Text style={s.bpmVal}>{h.bpm}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* ALERT */}
      <View style={s.box}>
        <Text style={s.boxTitle}>Alert recenti — {alerts.length} eventi</Text>
        {alerts.length === 0 ? (
          <Text style={s.sub}>Nessun alert registrato</Text>
        ) : alerts.slice(0,2).map(a => {
          const ac = ALERT_COLORS[a.anomaly?.severity] || ALERT_COLORS.warning
          const flags = [...(a.anomaly?.flags||[]), ...(a.anomaly?.critical||[])].join(' · ')
          return (
            <View key={a._id} style={[s.alertRow, { backgroundColor: ac.bg }]}>
              <Text style={[s.alertText, { color: ac.text }]}>
                {a.anomaly?.severity?.toUpperCase()} — BPM {Math.round(a.bpm)} | {a.temp_c?.toFixed(1)}°C
                {flags ? `\n${flags}` : ''}
              </Text>
              <Text style={s.alertTime}>{new Date(a.timestamp).toLocaleTimeString()}</Text>
            </View>
          )
        })}
      </View>

    </ScrollView>
  )
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#1a1a2e' },
  content:     { padding: 16, paddingBottom: 32 },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title:       { fontSize: 20, fontWeight: '500', color: '#fff', letterSpacing: 1 },
  sub:         { fontSize: 11, color: '#555', marginTop: 2 },
  badge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText:   { fontSize: 11, fontWeight: '500' },
  box:         { backgroundColor: '#16213e', borderRadius: 10, padding: 14, marginBottom: 10 },
  boxTitle:    { fontSize: 11, color: '#888', marginBottom: 10 },
  grid2:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metric:      { backgroundColor: '#0f1731', borderRadius: 8, padding: 10, borderLeftWidth: 3, borderLeftColor: '#378ADD', flex: 1, minWidth: '45%' },
  metricLabel: { fontSize: 10, color: '#888', marginBottom: 2 },
  metricVal:   { fontSize: 18, fontWeight: '500', color: '#fff' },
  metricUnit:  { fontSize: 11, color: '#aaa', fontWeight: '400' },
  posturaRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  posturaLabel:{ fontSize: 11, color: '#555' },
  passiVal:    { fontSize: 24, fontWeight: '500', color: '#fff', marginBottom: 4 },
  passiUnit:   { fontSize: 14, color: '#aaa', fontWeight: '400' },
  barBg:       { backgroundColor: '#0f1731', borderRadius: 4, height: 6, marginVertical: 4, overflow: 'hidden' },
  barFill:     { backgroundColor: '#378ADD', height: 6, borderRadius: 4 },
  gpsVal:      { fontSize: 16, fontWeight: '500', color: '#fff' },
  bpmList:     { flexDirection: 'row', alignItems: 'flex-end', gap: 4, paddingVertical: 8 },
  bpmItem:     { alignItems: 'center', width: 24 },
  bpmBar:      { width: 12, borderRadius: 2, marginBottom: 2 },
  bpmVal:      { fontSize: 8, color: '#555' },
  alertRow:    { borderRadius: 6, padding: 8, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  alertText:   { fontSize: 11, flex: 1 },
  alertTime:   { fontSize: 10, color: '#555', marginLeft: 8, whiteSpace: 'nowrap' },
})