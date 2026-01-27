import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Modal,
  FlatList,
  TextInput,
  Alert,
  Platform,
  ActionSheetIOS,
  Dimensions,
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Settings,
  Edit2,
  Users,
  UserPlus,
  ChefHat,
  BadgeCheck,
  X,
  Search,
  Heart,
} from 'lucide-react-native';
import Colors, { Spacing, Typography, BorderRadius } from '@/constants/colors';
import { useSocial } from '@/contexts/SocialContext';
import { useRecipes } from '@/contexts/RecipeContext';
import { User } from '@/types/recipe';
import Button from '@/components/Button';

type ListType = 'followers' | 'following' | 'recipes' | null;

export default function ProfileScreen() {
  const router = useRouter();
  const {
    currentUser,
    following,
    followers,
    getFollowingUsers,
    getFollowersUsers,
    getSuggestedUsers,
    toggleFollow,
    isFollowing,
    updateProfile,
  } = useSocial();
  const { customRecipes, favorites } = useRecipes();

  const [showListModal, setShowListModal] = useState<ListType>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(currentUser.displayName);
  const [editUsername, setEditUsername] = useState(currentUser.username);
  const [editBio, setEditBio] = useState(currentUser.bio);
  const [editAvatarUrl, setEditAvatarUrl] = useState(currentUser.avatarUrl);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSaveProfile = useCallback(() => {
    updateProfile({
      displayName: editName,
      username: editUsername,
      bio: editBio,
      avatarUrl: editAvatarUrl,
    });
    setShowEditModal(false);
    Alert.alert('Success', 'Profile updated successfully');
  }, [editName, editUsername, editBio, editAvatarUrl, updateProfile]);

  const pickImage = useCallback(async (useCamera: boolean) => {
    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Camera permission is required to take photos.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
          setEditAvatarUrl(result.assets[0].uri);
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Photo library permission is required to select photos.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
          setEditAvatarUrl(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  }, []);

  const handleChangePhoto = useCallback(() => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            pickImage(true);
          } else if (buttonIndex === 2) {
            pickImage(false);
          }
        }
      );
    } else {
      Alert.alert(
        'Change Photo',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: () => pickImage(true) },
          { text: 'Choose from Library', onPress: () => pickImage(false) },
        ]
      );
    }
  }, [pickImage]);

  const renderUserItem = useCallback(
    ({ item }: { item: User }) => {
      const isFollowingUser = isFollowing(item.id);
      return (
        <Pressable
          style={styles.userItem}
          onPress={() => {
            setShowListModal(null);
            router.push(`/user/${item.id}`);
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

  const renderSuggestedUser = useCallback(
    ({ item }: { item: User }) => {
      return (
        <Pressable
          style={styles.suggestedCard}
          onPress={() => router.push(`/user/${item.id}`)}
        >
          <Image source={{ uri: item.avatarUrl }} style={styles.suggestedAvatar} />
          <View style={styles.suggestedInfo}>
            <View style={styles.userNameRow}>
              <Text style={styles.suggestedName} numberOfLines={1}>
                {item.displayName}
              </Text>
              {item.isVerified && (
                <BadgeCheck size={12} color={Colors.primary} />
              )}
            </View>
            <Text style={styles.suggestedUsername}>@{item.username}</Text>
            <Text style={styles.suggestedRecipes}>
              {item.recipesCount} recipes
            </Text>
          </View>
          <Button
            title="Follow"
            variant="primary"
            size="sm"
            onPress={() => toggleFollow(item.id)}
          />
        </Pressable>
      );
    },
    [toggleFollow, router]
  );

  const filteredList =
    showListModal === 'followers'
      ? getFollowersUsers.filter(
          (user) =>
            !searchQuery ||
            user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.username.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : showListModal === 'following'
      ? getFollowingUsers.filter(
          (user) =>
            !searchQuery ||
            user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.username.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : [];

  const filteredRecipes = customRecipes.filter(
    (recipe) =>
      !searchQuery ||
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
            <Pressable style={styles.settingsButton} onPress={() => setShowEditModal(true)}>
              <Settings size={22} color={Colors.text} />
            </Pressable>
          </View>

          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: currentUser.avatarUrl }}
                style={styles.avatar}
              />
              <Pressable
                style={styles.editAvatarButton}
                onPress={() => setShowEditModal(true)}
              >
                <Edit2 size={14} color={Colors.textOnPrimary} />
              </Pressable>
            </View>

            <Text style={styles.displayName}>{currentUser.displayName}</Text>
            <Text style={styles.username}>@{currentUser.username}</Text>
            <Text style={styles.bio}>{currentUser.bio}</Text>

            <View style={styles.statsCarouselContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.statsCarousel}
                decelerationRate="fast"
                snapToInterval={85}
              >
                <Pressable
                  style={[styles.statCard, styles.statCard1]}
                  onPress={() => setShowListModal('recipes')}
                >
                  <View style={styles.statCardIcon}>
                    <ChefHat size={22} color="#fff" />
                  </View>
                  <Text style={styles.statCardValue}>{customRecipes.length}</Text>
                  <Text style={styles.statCardLabel}>Recipes</Text>
                </Pressable>

                <Pressable
                  style={[styles.statCard, styles.statCard2]}
                  onPress={() => router.push('/(tabs)/favorites')}
                >
                  <View style={[styles.statCardIcon, styles.statCardIconAccent]}>
                    <Heart size={22} color="#fff" />
                  </View>
                  <Text style={styles.statCardValue}>{favorites.length}</Text>
                  <Text style={styles.statCardLabel}>Favorites</Text>
                </Pressable>

                <Pressable
                  style={[styles.statCard, styles.statCard3]}
                  onPress={() => setShowListModal('followers')}
                >
                  <View style={[styles.statCardIcon, styles.statCardIconSecondary]}>
                    <Users size={22} color="#fff" />
                  </View>
                  <Text style={styles.statCardValue}>{followers.length}</Text>
                  <Text style={styles.statCardLabel}>Followers</Text>
                </Pressable>

                <Pressable
                  style={[styles.statCard, styles.statCard4]}
                  onPress={() => setShowListModal('following')}
                >
                  <View style={[styles.statCardIcon, styles.statCardIconTertiary]}>
                    <UserPlus size={22} color="#fff" />
                  </View>
                  <Text style={styles.statCardValue}>{following.length}</Text>
                  <Text style={styles.statCardLabel}>Following</Text>
                </Pressable>
              </ScrollView>
            </View>

          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suggested for You</Text>
            <FlatList
              data={getSuggestedUsers}
              keyExtractor={(item) => item.id}
              renderItem={renderSuggestedUser}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestedList}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  You're following everyone! Check back later.
                </Text>
              }
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <Pressable
                style={styles.actionCard}
                onPress={() => router.push('/discover')}
              >
                <Search size={24} color={Colors.primary} />
                <Text style={styles.actionTitle}>Find Users</Text>
                <Text style={styles.actionDesc}>
                  Discover new cooks to follow
                </Text>
              </Pressable>

              <Pressable
                style={styles.actionCard}
                onPress={() => setShowListModal('following')}
              >
                <Users size={24} color={Colors.secondary} />
                <Text style={styles.actionTitle}>My Network</Text>
                <Text style={styles.actionDesc}>
                  See who you're connected with
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <Modal
          visible={showListModal !== null && showListModal !== 'recipes'}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {showListModal === 'followers' ? 'Followers' : 'Following'}
              </Text>
              <Pressable
                onPress={() => {
                  setShowListModal(null);
                  setSearchQuery('');
                }}
                style={styles.closeButton}
              >
                <X size={24} color={Colors.text} />
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
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Users size={48} color={Colors.textSecondary} />
                  <Text style={styles.emptyTitle}>
                    {showListModal === 'followers'
                      ? 'No followers yet'
                      : "You're not following anyone"}
                  </Text>
                  <Text style={styles.emptySubtext}>
                    {showListModal === 'followers'
                      ? 'Share your recipes to gain followers!'
                      : 'Discover users to follow in the Discover tab'}
                  </Text>
                </View>
              }
            />
          </SafeAreaView>
        </Modal>

        <Modal
          visible={showListModal === 'recipes'}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>My Recipes</Text>
              <Pressable
                onPress={() => {
                  setShowListModal(null);
                  setSearchQuery('');
                }}
                style={styles.closeButton}
              >
                <X size={24} color={Colors.text} />
              </Pressable>
            </View>

            <View style={styles.searchContainer}>
              <Search size={18} color={Colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search recipes..."
                placeholderTextColor={Colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <FlatList
              data={filteredRecipes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.recipeItem}
                  onPress={() => {
                    setShowListModal(null);
                    setSearchQuery('');
                    router.push(`/recipe/${item.id}`);
                  }}
                >
                  <Image source={{ uri: item.imageUrl }} style={styles.recipeImage} />
                  <View style={styles.recipeInfo}>
                    <Text style={styles.recipeTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.recipeDetails}>
                      {item.cookTime} min • {item.servings} servings
                    </Text>
                  </View>
                </Pressable>
              )}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <ChefHat size={48} color={Colors.textSecondary} />
                  <Text style={styles.emptyTitle}>No recipes yet</Text>
                  <Text style={styles.emptySubtext}>
                    Start creating recipes to see them here!
                  </Text>
                </View>
              }
            />
          </SafeAreaView>
        </Modal>

        <Modal
          visible={showEditModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <Pressable
                onPress={() => setShowEditModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={Colors.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.editContent}>
              <View style={styles.editAvatarSection}>
                <Image
                  source={{ uri: editAvatarUrl }}
                  style={styles.editAvatar}
                />
                <Pressable style={styles.changePhotoButton} onPress={handleChangePhoto}>
                  <Text style={styles.changePhotoText}>Change Photo</Text>
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.input}
                value={editUsername}
                onChangeText={setEditUsername}
                placeholder="username"
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Tell us about yourself..."
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={4}
              />

              <Button
                title="Save Changes"
                onPress={handleSaveProfile}
                style={styles.saveButton}
              />
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    ...Typography.h1,
    color: Colors.text,
  },
  settingsButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    padding: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  displayName: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  username: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  bio: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  statsCarouselContainer: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  statsCarousel: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  statCard: {
    width: 95,
    height: 130,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  statCard1: {
    zIndex: 4,
    transform: [{ rotate: '-3deg' }],
  },
  statCard2: {
    zIndex: 3,
    transform: [{ rotate: '2deg' }],
  },
  statCard3: {
    zIndex: 2,
    transform: [{ rotate: '-2deg' }],
  },
  statCard4: {
    zIndex: 1,
    transform: [{ rotate: '3deg' }],
    marginRight: 0,
  },
  statCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statCardIconAccent: {
    backgroundColor: Colors.accent,
  },
  statCardIconSecondary: {
    backgroundColor: Colors.accent,
  },
  statCardIconTertiary: {
    backgroundColor: '#6366F1',
  },
  statCardValue: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: 2,
  },
  statCardLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  editButton: {
    width: '50%',
  },
  section: {
    paddingVertical: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  suggestedList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  suggestedCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    width: 150,
    marginRight: Spacing.md,
  },
  suggestedAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: Spacing.sm,
  },
  suggestedInfo: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  suggestedName: {
    ...Typography.bodyBold,
    color: Colors.text,
    textAlign: 'center' as const,
  },
  suggestedUsername: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  suggestedRecipes: {
    ...Typography.caption,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  actionsGrid: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  actionTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  actionDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  closeButton: {
    padding: Spacing.sm,
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
    padding: Spacing.lg,
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
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
  },
  editContent: {
    padding: Spacing.lg,
  },
  editAvatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  editAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: Spacing.md,
  },
  changePhotoButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  changePhotoText: {
    ...Typography.body,
    color: Colors.primary,
  },
  inputLabel: {
    ...Typography.label,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top' as const,
  },
  saveButton: {
    marginTop: Spacing.md,
  },
  recipeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  recipeImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeTitle: {
    ...Typography.body,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  recipeDetails: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});
