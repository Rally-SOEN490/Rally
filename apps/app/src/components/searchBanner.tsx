import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '@/constants/rallyTheme';

type Props = {
  title?: string;
  subtitle?: string;
};

export function SearchBanner({
  title = 'Search',
  subtitle = 'Find your next game',
}: Props) {
  return (
   <View style={styles.banner}>
      <Image
        source={require('@/assets/images/tabIcons/searchbanner_volleyball.png')}
        style={styles.ball}
        resizeMode="contain"
      />

      <Text style={styles.brand}>RALLY</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.forest,
    borderRadius: radii.card,
    paddingHorizontal: 20,
    paddingVertical: 22,
    overflow: 'hidden',
    minHeight: 150,
    justifyContent: 'center',
  },
  ball: {
  position: 'absolute',
  top: -15,
  bottom: 0,
  right: -30,
  width: 180,
  },
  brand: {
    color: colors.lime,
    fontSize: 20,
    letterSpacing: 1.5,
    fontWeight: '500',
  },
  title: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '700',
    marginTop: 6,
  },
  subtitle: {
    color: colors.lime,
    fontSize: 16,
    marginTop: 12,
  },
});