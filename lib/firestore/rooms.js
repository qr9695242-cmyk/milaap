// lib/firestore/rooms.js
import { initFirebaseClient } from '../lib/firebase/client'
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'

let db
function ensureDb(){
  if(db) return db
  const { db: _db } = initFirebaseClient()
  db = _db
  return db
}

export async function listRooms(){
  const db = ensureDb()
  const q = query(collection(db, 'rooms'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d=> ({ id: d.id, ...d.data() }))
}

export async function createRoom(name, ownerUid=null){
  const db = ensureDb()
  const channel = `${name.replace(/[^a-z0-9_-]/gi,'').toLowerCase()}-${Date.now()}`
  const payload = { name, channel, createdAt: serverTimestamp() }
  if(ownerUid) payload.owner = ownerUid
  const docRef = await addDoc(collection(db, 'rooms'), payload)
  return docRef.id
}

export async function getRoom(id){
  const db = ensureDb()
  const d = await getDoc(doc(db, 'rooms', id))
  if(!d.exists()) return null
  return { id: d.id, ...d.data() }
}

export async function registerParticipant(roomId, uid, displayName){
  const db = ensureDb()
  const ref = doc(db, 'rooms', roomId, 'participants', String(uid))
  await setDoc(ref, { uid: String(uid), displayName: displayName || 'Anonymous', joinedAt: serverTimestamp(), isMuted: false })
}

export function listenParticipants(roomId, cb){
  const db = ensureDb()
  const coll = collection(db, 'rooms', roomId, 'participants')
  return onSnapshot(coll, snap=>{
    const participants = snap.docs.map(d=> ({ id: d.id, ...d.data() }))
    cb(participants)
  })
}

export async function setParticipantMute(roomId, uid, isMuted){
  const db = ensureDb()
  const ref = doc(db, 'rooms', roomId, 'participants', String(uid))
  await setDoc(ref, { isMuted }, { merge: true })
}
