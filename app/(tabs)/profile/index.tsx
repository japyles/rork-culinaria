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
  Animated,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import Svg, { Defs, Path, Text as SvgText, TextPath, LinearGradient, Stop, Circle as SvgCircle } from 'react-native-svg';
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

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(currentUser.displayName);
  const [editUsername, setEditUsername] = useState(currentUser.username);
  const [editBio, setEditBio] = useState(currentUser.bio);
  const [editAvatarUrl, setEditAvatarUrl] = useState(currentUser.avatarUrl);

  const shakeAnim1 = useRef(new Animated.Value(0)).current;
  const shakeAnim2 = useRef(new Animated.Value(0)).current;
  const shakeAnim3 = useRef(new Animated.Value(0)).current;
  const shakeAnim4 = useRef(new Animated.Value(0)).current;

  const triggerShake = useCallback((anim: Animated.Value, callback: () => void) => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 50, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -1, duration: 50, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 1, duration: 50, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -1, duration: 50, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0.5, duration: 50, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start(() => callback());
  }, []);

  const getShakeRotation = (anim: Animated.Value) => {
    return anim.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: ['-8deg', '0deg', '8deg'],
    });
  };

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

            <View style={styles.statsCircleContainer}>
              <Pressable
                style={styles.statCircleWrapper}
                onPress={() => triggerShake(shakeAnim1, () => router.push('/recipes-modal'))}
              >
                <Animated.View style={[styles.statCircle, { transform: [{ scale: shakeAnim1.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.95, 1, 1.05] }) }] }]}>
                  <View style={styles.statCircleInner}>
                    <Svg width={78} height={78} style={styles.glassSvg}>
                      <Defs>
                        <LinearGradient id="glassGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
                          <Stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
                          <Stop offset="50%" stopColor="rgba(255,255,255,0.15)" />
                          <Stop offset="100%" stopColor="rgba(255,255,255,0.25)" />
                        </LinearGradient>
                        <Path id="curvedPath1" d="M 10,39 A 29,29 0 0,0 68,39" />
                      </Defs>
                      <SvgCircle cx="39" cy="39" r="37" fill="url(#glassGrad1)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                      <SvgCircle cx="24" cy="22" r="12" fill="rgba(255,255,255,0.4)" />
                      <SvgCircle cx="20" cy="18" r="4" fill="rgba(255,255,255,0.7)" />
                      <SvgText fill={Colors.textSecondary} fontSize="9" fontWeight="600">
                        <TextPath href="#curvedPath1" startOffset="50%" textAnchor="middle">
                          Recipes
                        </TextPath>
                      </SvgText>
                    </Svg>
                    <View style={styles.circleContent}>
                      <ChefHat size={22} color={Colors.text} />
                      <Text style={styles.statCircleValue}>{customRecipes.length}</Text>
                    </View>
                  </View>
                </Animated.View>
              </Pressable>

              <Pressable
                style={styles.statCircleWrapper}
                onPress={() => triggerShake(shakeAnim2, () => router.push('/favorites-modal'))}
              >
                <Animated.View style={[styles.statCircle, { transform: [{ scale: shakeAnim2.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.95, 1, 1.05] }) }] }]}>
                  <View style={styles.statCircleInner}>
                    <Svg width={78} height={78} style={styles.glassSvg}>
                      <Defs>
                        <LinearGradient id="glassGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                          <Stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
                          <Stop offset="50%" stopColor="rgba(255,255,255,0.15)" />
                          <Stop offset="100%" stopColor="rgba(255,255,255,0.25)" />
                        </LinearGradient>
                        <Path id="curvedPath2" d="M 10,39 A 29,29 0 0,0 68,39" />
                      </Defs>
                      <SvgCircle cx="39" cy="39" r="37" fill="url(#glassGrad2)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                      <SvgCircle cx="24" cy="22" r="12" fill="rgba(255,255,255,0.4)" />
                      <SvgCircle cx="20" cy="18" r="4" fill="rgba(255,255,255,0.7)" />
                      <SvgText fill={Colors.textSecondary} fontSize="9" fontWeight="600">
                        <TextPath href="#curvedPath2" startOffset="50%" textAnchor="middle">
                          Favorites
                        </TextPath>
                      </SvgText>
                    </Svg>
                    <View style={styles.circleContent}>
                      <Heart size={22} color={Colors.text} />
                      <Text style={styles.statCircleValue}>{favorites.length}</Text>
                    </View>
                  </View>
                </Animated.View>
              </Pressable>

              <Pressable
                style={styles.statCircleWrapper}
                onPress={() => triggerShake(shakeAnim3, () => router.push('/followers-modal'))}
              >
                <Animated.View style={[styles.statCircle, { transform: [{ scale: shakeAnim3.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.95, 1, 1.05] }) }] }]}>
                  <View style={styles.statCircleInner}>
                    <Svg width={78} height={78} style={styles.glassSvg}>
                      <Defs>
                        <LinearGradient id="glassGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
                          <Stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
                          <Stop offset="50%" stopColor="rgba(255,255,255,0.15)" />
                          <Stop offset="100%" stopColor="rgba(255,255,255,0.25)" />
                        </LinearGradient>
                        <Path id="curvedPath3" d="M 10,39 A 29,29 0 0,0 68,39" />
                      </Defs>
                      <SvgCircle cx="39" cy="39" r="37" fill="url(#glassGrad3)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                      <SvgCircle cx="24" cy="22" r="12" fill="rgba(255,255,255,0.4)" />
                      <SvgCircle cx="20" cy="18" r="4" fill="rgba(255,255,255,0.7)" />
                      <SvgText fill={Colors.textSecondary} fontSize="9" fontWeight="600">
                        <TextPath href="#curvedPath3" startOffset="50%" textAnchor="middle">
                          Followers
                        </TextPath>
                      </SvgText>
                    </Svg>
                    <View style={styles.circleContent}>
                      <Users size={22} color={Colors.text} />
                      <Text style={styles.statCircleValue}>{followers.length}</Text>
                    </View>
                  </View>
                </Animated.View>
              </Pressable>

              <Pressable
                style={styles.statCircleWrapper}
                onPress={() => triggerShake(shakeAnim4, () => router.push('/following-modal'))}
              >
                <Animated.View style={[styles.statCircle, { transform: [{ scale: shakeAnim4.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.95, 1, 1.05] }) }] }]}>
                  <View style={styles.statCircleInner}>
                    <Svg width={78} height={78} style={styles.glassSvg}>
                      <Defs>
                        <LinearGradient id="glassGrad4" x1="0%" y1="0%" x2="0%" y2="100%">
                          <Stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
                          <Stop offset="50%" stopColor="rgba(255,255,255,0.15)" />
                          <Stop offset="100%" stopColor="rgba(255,255,255,0.25)" />
                        </LinearGradient>
                        <Path id="curvedPath4" d="M 10,39 A 29,29 0 0,0 68,39" />
                      </Defs>
                      <SvgCircle cx="39" cy="39" r="37" fill="url(#glassGrad4)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                      <SvgCircle cx="24" cy="22" r="12" fill="rgba(255,255,255,0.4)" />
                      <SvgCircle cx="20" cy="18" r="4" fill="rgba(255,255,255,0.7)" />
                      <SvgText fill={Colors.textSecondary} fontSize="9" fontWeight="600">
                        <TextPath href="#curvedPath4" startOffset="50%" textAnchor="middle">
                          Following
                        </TextPath>
                      </SvgText>
                    </Svg>
                    <View style={styles.circleContent}>
                      <UserPlus size={22} color={Colors.text} />
                      <Text style={styles.statCircleValue}>{following.length}</Text>
                    </View>
                  </View>
                </Animated.View>
              </Pressable>
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
                onPress={() => router.push('/following-modal')}
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
  statsCircleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  statCircleWrapper: {
    alignItems: 'center',
  },
  statCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
  },
  statCircleInner: {
    flex: 1,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glassSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  circleContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginTop: -6,
  },
  statCircleValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
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
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
});
