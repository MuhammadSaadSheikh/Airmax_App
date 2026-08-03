import { Text } from '@/components/AppText';
import Ionicons from '@react-native-vector-icons/ionicons';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { useEffect } from 'react';
import { router } from '@/navigation/router';
import LinearGradient from 'react-native-linear-gradient';
import { useAuthStore } from '@/store/authStore';
import { colors, fonts } from '@/constants/theme';
import splashBackground from '../assets/images/splash.png';

export default function Splash() {
  const { user, hydrated } = useAuthStore();
  useEffect(() => { if (!hydrated) return; const t = setTimeout(() => router.replace(user ? (user.role === 'admin' ? '/(admin)' : '/(customer)') : '/(auth)/login'), 1800); return () => clearTimeout(t); }, [hydrated, user]);
  return <ImageBackground source={splashBackground} style={styles.page} resizeMode="cover"><LinearGradient colors={['rgba(5,11,30,.3)','rgba(5,11,30,.05)','rgba(5,11,30,.72)']} style={StyleSheet.absoluteFill}/><View style={styles.brand}><View style={styles.logo}><Ionicons name="wifi" size={37} color={colors.primary}/></View><Text style={styles.name}>AIRMAX</Text><Text style={styles.service}>INTERNET SERVICES</Text></View><View style={styles.footer}><View style={styles.line}/><Text style={styles.tagline}>Faster Connection, Better Life</Text></View></ImageBackground>;
}
const styles=StyleSheet.create({page:{flex:1,alignItems:'center',justifyContent:'center'},brand:{alignItems:'center',marginTop:-120},logo:{width:78,height:78,borderRadius:24,backgroundColor:'rgba(4,20,48,.88)',borderWidth:1,borderColor:colors.primary,alignItems:'center',justifyContent:'center',shadowColor:colors.primary,shadowOpacity:.8,shadowRadius:24},name:{color:'white',fontSize:44,fontFamily:fonts.display,letterSpacing:5,marginTop:20},service:{color:colors.primary,fontSize:12,fontWeight:'800',letterSpacing:4,marginTop:4},footer:{position:'absolute',bottom:62,alignItems:'center'},line:{width:42,height:2,backgroundColor:colors.primary,marginBottom:14},tagline:{color:'#D5E7FF',fontSize:14,letterSpacing:.5}});
