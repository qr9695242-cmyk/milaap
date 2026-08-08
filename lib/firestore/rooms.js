// lib/firestore/rooms.js
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, getDoc } from 'firebase/firestore'

let db
function initFirebase(){
  if(db) return db
  if(!getApps().length){
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    }
    try{ initializeApp(config) }catch(e){ /* already initialized maybe */ }
  }
  db = getFirestore()
  return db
}

export async function listRooms(){
  const db = initFirebase()
  const q = query(collection(db, 'rooms'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d=> ({ id: d.id, ...d.data() }))
}

export async function createRoom(name){
  const db = initFirebase()
  const channel = `${name.replace(/[^a-z0-9_-]/gi,'').toLowerCase()}-${Date.now()}`
  const docRef = await addDoc(collection(db, 'rooms'), { name, channel, createdAt: serverTimestamp() })
  return docRef.id
}

export async function getRoom(id){
  const db = initFirebase()
  const d = await getDoc(doc(db, 'rooms', id))
  if(!d.exists()) return null
  return { id: d.id, ...d.data() }
}
