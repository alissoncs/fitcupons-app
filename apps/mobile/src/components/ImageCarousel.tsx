import { useState, type ReactNode } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { useTheme } from '@/theme';

export type CarouselImage = {
  url: string;
  blurhash?: string | null;
  alt?: string | null;
};

type Props = {
  images: CarouselImage[];
  height: number;
  width: number;
  onPressImage?: (index: number) => void;
  bottomLeft?: ReactNode;
  topRight?: ReactNode;
};

export function ImageCarousel({ images, height, width, onPressImage, bottomLeft, topRight }: Props) {
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const many = images.length > 1;
  const useCounter = images.length > 6;

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(event.nativeEvent.contentOffset.x / Math.max(width, 1));
    if (next !== index) setIndex(next);
  }

  if (images.length === 0) {
    return <View style={{ width, height, backgroundColor: theme.primarySoft }} />;
  }

  return (
    <View style={{ width, height }}>
      <ScrollView
        horizontal
        pagingEnabled
        nestedScrollEnabled
        directionalLockEnabled
        scrollEnabled={many}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
      >
        {images.map((image, imageIndex) => (
          <Pressable
            key={`${image.url}-${imageIndex}`}
            onPress={() => onPressImage?.(imageIndex)}
            accessibilityRole="imagebutton"
            accessibilityLabel={image.alt ?? `Foto ${imageIndex + 1} de ${images.length}`}
          >
            <Image
              source={{ uri: image.url }}
              placeholder={image.blurhash ? { blurhash: image.blurhash } : undefined}
              contentFit="cover"
              style={{ width, height }}
              transition={200}
            />
          </Pressable>
        ))}
      </ScrollView>
      {topRight ? <View style={styles.topRight} pointerEvents="box-none">{topRight}</View> : null}
      {bottomLeft ? <View style={styles.bottomLeft} pointerEvents="box-none">{bottomLeft}</View> : null}
      {many && !useCounter ? (
        <View style={styles.dots}>
          {images.map((_, dotIndex) => (
            <View
              key={dotIndex}
              style={[
                styles.dot,
                { backgroundColor: dotIndex === index ? theme.primary : 'rgba(255,255,255,0.4)' },
              ]}
            />
          ))}
        </View>
      ) : null}
      {useCounter ? (
        <View style={[styles.counter, { backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 999 }]}>
          <Text style={styles.counterText}>{`${index + 1}/${images.length}`}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  topRight: { position: 'absolute', top: 12, right: 12 },
  bottomLeft: { position: 'absolute', left: 12, bottom: 16 },
  dots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  counter: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  counterText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
