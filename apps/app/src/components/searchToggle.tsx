/*
AI declaration:
50% or more AI-generated
*/
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '@/constants/rallyTheme';

type Props<T extends string> = {
  options: readonly { value: T; label: string }[];
  selected: T;
  onChange: (value: T) => void;
};

export function SegmentedToggle<T extends string>({
  options,
  selected,
  onChange,
}: Props<T>) {
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {options.map((option) => {
        const isActive = option.value === selected;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={[styles.segment, isActive && styles.segmentActive]}
          >
            <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.forest,
    borderRadius: radii.pill,
    padding: 5,
  },
  segment: {
    flex: 1,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.white,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  labelActive: {
    color: colors.forest,
  },
  labelInactive: {
    color: colors.white,
  },
});