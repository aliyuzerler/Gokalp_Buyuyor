import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';

import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { ScreenHeader } from '@/components/screen-header';
import { useMediaGallery } from '@/features/media/use-media';
import { mediaAbsoluteUri } from '@/services/media/media-service';
import { tr } from '@/i18n/tr';
import { colors, spacing, typography } from '@/theme/tokens';

/**
 * Medya arşivi: uygulama özel alanındaki fotoğraf/videoların ızgara görünümü.
 */
export default function MediaGalleryScreen() {
  const { assets, loading, deleteAsset } = useMediaGallery();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader
        title={tr.media.title}
        subtitle={tr.media.sizeNote(100)}
        onBack={() => router.back()}
      />
      <FlatList
        contentContainerStyle={styles.list}
        data={assets}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            style={styles.cell}
            onLongPress={() => {
              void deleteAsset(item);
            }}
            testID={`gallery-${item.id}`}
          >
            {item.media_type === 'image' || item.thumbnail_relative_path ? (
              <Image
                source={{ uri: mediaAbsoluteUri(item.thumbnail_relative_path ?? item.relative_path) }}
                style={styles.image}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.image, styles.videoPh]}>
                <Ionicons name="videocam" size={24} color={colors.textMuted} />
              </View>
            )}
            {item.media_type === 'video' ? (
              <View style={styles.videoBadge}>
                <Ionicons name="play" size={12} color={colors.white} />
              </View>
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <EmptyState title={tr.media.title} description={tr.media.empty} />
            </View>
          ) : (
            <Text style={styles.loading}>{tr.common.loading}</Text>
          )
        }
      />
      <View style={styles.fabRow}>
        <Button
          label={tr.media.addButton}
          variant="secondary"
          onPress={() => router.push('/journal/editor?type=memory&addMedia=1')}
          testID="gallery-add"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.xs,
    paddingBottom: 96,
  },
  cell: {
    flex: 1 / 3,
    aspectRatio: 1,
    margin: 2,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  videoPh: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    padding: 4,
  },
  empty: {
    padding: spacing.md,
  },
  loading: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  fabRow: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
  },
});
