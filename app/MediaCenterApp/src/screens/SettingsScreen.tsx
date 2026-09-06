import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../config/theme';
import { getSettings } from '../services/apiClient';
import { AppSettings } from '../types';
import { SERVER_CONFIG, TMDB_CONFIG } from '../config/api';

export default function SettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingService, setTestingService] = useState<string | null>(null);

  const [settings, setSettings] = useState<AppSettings>({
    tmdbApiKey: '',
    serverIp: '',
    seerrUrl: '',
    seerrApiKey: '',
    sonarrUrl: '',
    sonarrApiKey: '',
    radarrUrl: '',
    radarrApiKey: '',
    plexUrl: '',
    plexToken: '',
  });

  const [pushEnabled, setPushEnabled] = useState(true);
  const [preferredQuality, setPreferredQuality] = useState('1080p');

  useEffect(() => {
    loadCurrentSettings();
  }, []);

  const loadCurrentSettings = async () => {
    try {
      const current = await getSettings();
      setSettings(current);
      const savedPush = await AsyncStorage.getItem('PUSH_ENABLED');
      if (savedPush !== null) setPushEnabled(savedPush === 'true');
      const savedQuality = await AsyncStorage.getItem('PREFERRED_QUALITY');
      if (savedQuality) setPreferredQuality(savedQuality);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await AsyncStorage.setItem('APP_SETTINGS', JSON.stringify(settings));
      await AsyncStorage.setItem('PUSH_ENABLED', pushEnabled ? 'true' : 'false');
      await AsyncStorage.setItem('PREFERRED_QUALITY', preferredQuality);
      Alert.alert('Éxito', 'Configuración guardada correctamente.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (type: 'tmdb' | 'seerr' | 'plex') => {
    setTestingService(type);
    try {
      if (type === 'tmdb') {
        const apiKey = TMDB_CONFIG.API_KEY;
        if (!apiKey || apiKey.includes('PEGAR_AQUI')) throw new Error('Falta la TMDB API Key en el código');
        const res = await fetch(
          `https://api.themoviedb.org/3/authentication?api_key=${apiKey}`
        );
        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        Alert.alert('Conexión Exitosa', 'TMDB respondió correctamente.');
      } else if (type === 'seerr') {
        const apiKey = SERVER_CONFIG.SEERR_API_KEY;
        if (!settings.seerrUrl || !apiKey || apiKey.includes('PEGAR_AQUI'))
          throw new Error('Completa la URL y asegúrate de tener la API Key en el código');
        const res = await fetch(`${settings.seerrUrl}/api/v1/status`, {
          headers: { 'X-Api-Key': apiKey },
        });
        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        Alert.alert('Conexión Exitosa', 'Seerr respondió correctamente.');
      } else if (type === 'plex') {
        if (!settings.plexUrl) throw new Error('Completa la URL de Plex');
        const token = SERVER_CONFIG.PLEX_TOKEN;
        const url = token && !token.includes('PEGAR_AQUI')
          ? `${settings.plexUrl}/identity?X-Plex-Token=${token}`
          : `${settings.plexUrl}/identity`;
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        Alert.alert('Conexión Exitosa', 'Servidor Plex accesible.');
      }
    } catch (err: any) {
      Alert.alert('Fallo de conexión', err?.message || 'No se pudo conectar.');
    } finally {
      setTestingService(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Notificaciones Push</Text>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ true: theme.colors.primary, false: theme.colors.surface }}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Calidad Preferida</Text>
          <View style={styles.qualitySelector}>
            {['1080p', '4K'].map((q) => (
              <Pressable
                key={q}
                style={[
                  styles.qualityBtn,
                  preferredQuality === q && styles.qualityBtnActive,
                ]}
                onPress={() => setPreferredQuality(q)}
              >
                <Text
                  style={[
                    styles.qualityBtnText,
                    preferredQuality === q && styles.qualityBtnTextActive,
                  ]}
                >
                  {q}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.serviceHeader}>
          <Text style={styles.sectionTitle}>TMDB (Descubrimiento)</Text>
          <Pressable
            style={styles.testBtn}
            onPress={() => testConnection('tmdb')}
            disabled={testingService !== null}
          >
            <Text style={styles.testBtnText}>
              {testingService === 'tmdb' ? 'Probando...' : 'Probar'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.serviceHeader}>
          <Text style={styles.sectionTitle}>Seerr / Overseerr</Text>
          <Pressable
            style={styles.testBtn}
            onPress={() => testConnection('seerr')}
            disabled={testingService !== null}
          >
            <Text style={styles.testBtnText}>
              {testingService === 'seerr' ? 'Probando...' : 'Probar'}
            </Text>
          </Pressable>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>URL de Seerr</Text>
          <TextInput
            style={styles.input}
            placeholder="http://192.168.1.50:5055"
            placeholderTextColor={theme.colors.text.secondary}
            value={settings.seerrUrl}
            onChangeText={(t) => setSettings({ ...settings, seerrUrl: t })}
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.serviceHeader}>
          <Text style={styles.sectionTitle}>Plex Media Server</Text>
          <Pressable
            style={styles.testBtn}
            onPress={() => testConnection('plex')}
            disabled={testingService !== null}
          >
            <Text style={styles.testBtnText}>
              {testingService === 'plex' ? 'Probando...' : 'Probar'}
            </Text>
          </Pressable>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>URL de Plex</Text>
          <TextInput
            style={styles.input}
            placeholder="http://192.168.1.50:32400"
            placeholderTextColor={theme.colors.text.secondary}
            value={settings.plexUrl}
            onChangeText={(t) => setSettings({ ...settings, plexUrl: t })}
            autoCapitalize="none"
          />
        </View>
      </View>

      <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveButtonText}>
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </Text>
      </Pressable>

      <Text style={styles.version}>Media Center App • v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  testBtn: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#333',
  },
  testBtnText: {
    color: theme.colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    color: theme.colors.text.primary,
    fontSize: 14,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#333',
  },
  qualitySelector: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  qualityBtn: {
    flex: 1,
    paddingVertical: theme.spacing.sm + 2,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  qualityBtnActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
  },
  qualityBtnText: {
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  qualityBtnTextActive: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  saveButton: {
    margin: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  version: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    fontSize: 12,
  },
});
