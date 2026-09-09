import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, Animated } from 'react-native';
import { theme } from '../config/theme';

interface Props {
  posterPath: string | null;
  title: string;
  year?: string;
  rating?: number;
  mediaType?: 'movie' | 'tv';
  onPress: () => void;
}

export const MediaCard: React.FC<Props> = ({ posterPath, title, year, rating, onPress }) => {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const imageUrl = posterPath
    ? `https://image.tmdb.org/t/p/w342${posterPath}`
    : 'https://placehold.co/342x513/1F1F1F/A0A0A0?text=Sin+Imagen';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.image} />
          {rating ? (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>⭐ {rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {year && <Text style={styles.year}>{year}</Text>}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 130, // Slightly wider
    marginRight: theme.spacing.md,
  },
  imageContainer: {
    width: 130,
    height: 195, // Maintains 2:3 ratio
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    elevation: 8, // Stronger shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)', // Subtle stroke
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  ratingBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: theme.colors.glass,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ratingText: {
    color: theme.colors.text.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: theme.spacing.sm,
    letterSpacing: 0.2,
  },
  year: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
});
