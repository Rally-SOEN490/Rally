import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

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
      {/* Volleyball line art from Figma, cropped by the banner's overflow: hidden */}
      <View style={styles.ball} pointerEvents="none">
        <Svg width={160} height={160} viewBox="14 -27 160 160" fill="none">
          <Path
            stroke={colors.seam}
            strokeLinejoin="round"
            strokeMiterlimit={2}
            strokeWidth={2}
            d="M124.589 125.086c39.825-16.912 58.386-62.886 41.509-102.667-16.881-39.782-62.89-58.421-102.675-41.505C23.637-2.17 4.998 43.796 21.913 83.58c16.917 39.786 62.89 58.421 102.676 41.505Z"
          />
          <Path
            stroke={colors.seam}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeMiterlimit={2}
            strokeWidth={2}
            d="M62.667-17.5C56.815 9.956 70.253 38.105 94 53m0 0c-1.018 28.67-19.7 53.815-47 62.667M94 53c21.542-14.088 56.988-14.382 78.333 3.917"
          />
          <Path
            stroke={colors.seam}
            strokeLinejoin="round"
            strokeMiterlimit={2}
            strokeWidth={2}
            d="M66.583 21.667s45.277-33.253 94-7.834M78.333 88.25S29.728 68.745 27.417 13.833m105.75 31.334s6.11 56.791-40.264 86.284"
          />
        </Svg>
      </View>

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
    right: -10,
    top: -10,
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