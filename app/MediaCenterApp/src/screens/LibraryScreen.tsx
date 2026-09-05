import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { theme } from '../config/theme';
import { MediaCard } from '../components/MediaCard';

export default function LibraryScreen() {
  const [activeTab, setActiveTab] = useState<'movies' | 'tv'>('movies');
  const [configured, setConfigured] = useState(false); // mock

  if (!configured) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Plex no configurado</Text>
        <Text style={styles.emptyText}>Ve a Configuración para conectar tu servidor Plex.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <Pressable 
          style={[styles.tab, activeTab === 'movies' && styles.activeTab]}
          onPress={() => setActiveTab('movies')}
        >
          <Text style={[styles.tabText, activeTab === 'movies' && styles.activeTabText]}>Películas</Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'tv' && styles.activeTab]}
          onPress={() => setActiveTab('tv')}
        >
          <Text style={[styles.tabText, activeTab === 'tv' && styles.activeTabText]}>Series</Text>
        </Pressable>
      </View>
      
      <FlatList
        data={[]}
        numColumns={3}
        renderItem={() => null}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Tu biblioteca está vacía.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  tabs: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    color: theme.colors.text.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeTabText: {
    color: theme.colors.text.primary,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    color: theme.colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
  },
});
