import AsyncStorage from '@react-native-async-storage/async-storage';

const AVATAR_PREFIX = '@nongxanh:avatar:';

export async function getAvatarUri(userId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(`${AVATAR_PREFIX}${userId}`);
  } catch {
    return null;
  }
}

export async function setAvatarUri(userId: string, uri: string): Promise<void> {
  await AsyncStorage.setItem(`${AVATAR_PREFIX}${userId}`, uri);
}

export async function removeAvatar(userId: string): Promise<void> {
  await AsyncStorage.removeItem(`${AVATAR_PREFIX}${userId}`);
}
