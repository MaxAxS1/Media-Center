import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { theme } from '../config/theme';

interface Props {
  variant: 'card' | 'row' | 'detail' | 'text';
  width?: number;
  height?: number;
}

export const LoadingSkeleton: React.FC<Props> = ({ variant, width, height }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const getVariantStyles = () => {
    switch (variant) {
      case 'card':
        return { width: width || 120, height: height || 180, borderRadius: theme.borderRadius.md };
      case 'row':
        return { width: width || 350, height: height || 180, borderRadius: theme.borderRadius.md };
      case 'detail':
        return { width: width || 400, height: height || 300, borderRadius: 0 };
      case 'text':
        return { width: width || 200, height: height || 20, borderRadius: theme.borderRadius.sm };
      default:
        return { width: 100, height: 100 };
    }
  };

  return (
    <Animated.View
      style={[
        styles.skeleton,
        getVariantStyles(),
        { opacity },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: theme.colors.surface,
  },
});
