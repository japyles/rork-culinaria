import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Users, X, Search, BadgeCheck } from 'lucide-react-native';
import Colors, { Spacing, Typography, BorderRadius } from '@/constants/colors';
import { useSocial } from '@/contexts/SocialContext';
import { User } from '@/types/recipe';
import Button from '@/components/Button';

export default function FollowersModalScreen() {
  const router = useRouter();
  const { getFollowersUsers, toggleFollow, isFollowing } = useSocial();
  const [searchQuery, setSearchQuery] = useState('');

  const closeSheet = () => {
    router.back();
  };

  const filteredList = getFollowersUsers.filter(
    (user) =>
      !searchQuery ||
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUserItem = useCallback(
    ({ item }: { item: User }) => {
      const isFollowingUser = isFollowing(item.id);
      return (
        <Pressable
          style={styles.userItem}
          onPress={() => {
            router.back();
            setTimeout(() => router.push(`/user/${item.id}`), 100);
          }}
        >
          <Image source={{ uri: item.avatarUrl }} style={styles.userAvatar} />
          <View style={styles.userInfo}>
            <View style={styles.userNameRow}>
              <Text style={styles.userDisplayName}>{item.displayName}</Text>
              {item.isVerified && (
                <BadgeCheck size={14} color={Colors.primary} />
              )}
            </View>
            <Text style={styles.userUsername}>@{item.username}</Text>
          </View>
          <Button
            title={isFollowingUser ? 'Following' : 'Follow'}
            variant={isFollowingUser ? 'outline' : 'primary'}
            size="sm"
            onPress={() => toggleFollow(item.id)}
          />
        </Pressable>
      );
    },
    [isFollowing, toggleFollow, router]
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.surface, Colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      
      <View style={styles.sheetHeader}>
        <View style={styles.headerTitleRow}>
          <Users size={22} color={Colors.secondary} />
          <Text style={styles.sheetTitle}>Followers</Text>
        </View>
        <Pressable onPress={closeSheet} style={styles.closeButton}>
          <X size={22} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <Search size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Users size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No followers yet</Text>
            <Text style={styles.emptySubtext}>
              Share your recipes to gain followers!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sheetTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  closeButton: {
    padding: Spacing.xs,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    paddingVertical: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: Spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  userDisplayName: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  userUsername: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: Spacing.sm,
  },
});
