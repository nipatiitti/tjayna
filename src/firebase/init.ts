import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBh4TsaJNYRZKm4wY4NLwkIjbnXg7yi8Qo',
  authDomain: 'tj-jayna.firebaseapp.com',
  projectId: 'tj-jayna',
  storageBucket: 'tj-jayna.appspot.com',
  messagingSenderId: '968364645905',
  appId: '1:968364645905:web:f43488a40e7a351770dbb0',
}

export const firebaseApp = initializeApp(firebaseConfig)
export const firestore = getFirestore(firebaseApp)
