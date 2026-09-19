import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

export function Splash() {
  return (
    <View style={styles.box}>
      <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
      <Text style={styles.word}>fitcupons</Text>
      <ActivityIndicator color="#FFFFFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    backgroundColor: '#5F4B8B',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  logo: { width: 88, height: 88, borderRadius: 20 },
  word: { color: '#FBFAFD', fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
});
