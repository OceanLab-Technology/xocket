import { Text, View } from 'react-native'

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-black">
      <Text className="text-2xl font-bold text-black dark:text-white">
        Welcome to Xocket
      </Text>
      <Text className="mt-2 text-neutral-500">
        Your Expo app is wired into the monorepo.
      </Text>
    </View>
  )
}
