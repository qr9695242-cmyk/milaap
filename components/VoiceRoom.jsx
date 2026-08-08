// components/VoiceRoom.jsx
'use client'
import React, { useEffect, useState, useRef } from 'react'
import { createClient, createMicrophoneAndCameraTracks } from 'agora-rtc-sdk-ng'
import { initFirebaseClient, onAuthStateChanged, signInAnonymously } from '../lib/firebase/client'
import { registerParticipant, listenParticipants, setParticipantMute, getRoom } from '../lib/firestore/rooms'

export default function VoiceRoom({ channel }){
  const [joined, setJoined] = useState(false)
  const [muted, setMuted] = useState(false)
  const [remoteUsers, setRemoteUsers] = useState([])
  const [participants, setParticipants] = useState([])
  const [displayName, setDisplayName] = useState('')
  const clientRef = useRef(null)
  const localAudioTrackRef = useRef(null)
  const uidRef = useRef(null)
  const roomIdRef = useRef(null)

  useEffect(()=>{
    initFirebaseClient()
    // ensure anonymous auth
    signInAnonymously().catch(()=>{})
    const { auth } = initFirebaseClient()
    const unsubscribe = onAuthStateChanged(auth, user=>{
      if(user){ uidRef.current = user.uid }
    })
    return ()=>{ unsubscribe(); leave().catch(()=>{}) }
  },[])

  useEffect(()=>{
    if(!channel) return
    // channel is the channel name; roomId needs to be discovered by looking up rooms collection
    // we won't map channel->roomId here; participants will be registered under channel name in rooms collection
  },[channel])

  async function getTokenAndUid(){
    const resp = await fetch('/api/agora-token', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ channel }) })
    if(!resp.ok) throw new Error('token error')
    const data = await resp.json()
    return data
  }

  async function join(){
    if(!displayName){
      const name = prompt('Enter display name for this room (will be visible to others)')
      if(!name) return
      setDisplayName(name)
    }

    try{
      const { token, uid: assignedUid } = await getTokenAndUid()
      uidRef.current = assignedUid
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID
      const client = createClient({ mode: 'rtc', codec: 'vp8' })
      clientRef.current = client

      client.on('user-published', async (user, mediaType)=>{
        await client.subscribe(user, mediaType)
        if(mediaType === 'audio'){
          const remoteAudioTrack = user.audioTrack
          remoteAudioTrack && remoteAudioTrack.play()
        }
        setRemoteUsers(prev=>{
          if(prev.find(p=>p.uid===user.uid)) return prev
          return [...prev, { uid: user.uid }]
        })
      })

      client.on('user-unpublished', (user)=>{
        setRemoteUsers(prev=> prev.filter(p=>p.uid!==user.uid))
      })

      await client.join(appId, channel, token, assignedUid)

      // publish local audio only
      const [microphoneTrack] = await createMicrophoneAndCameraTracks({ encoderConfig: 'low' }, false)
      localAudioTrackRef.current = microphoneTrack
      await client.publish([microphoneTrack])
      setJoined(true)
      setMuted(false)

      // register participant in Firestore under rooms/{channel or roomId}/participants/{uid}
      // find room document that matches this channel
      const rooms = await import('firebase/firestore').then(({ getDocs, collection, query, where })=> null).catch(()=>null)
      // simpler: rely on createRoom storing channel and route using roomId so channel param is roomId? In our flow page passes actual channel now.

      // For registration we will try to find the room doc by channel
      try{
        const { db } = initFirebaseClient()
        const { getDocs, collection, query, where } = await import('firebase/firestore')
        const q = query(collection(db, 'rooms'), where('channel', '==', channel))
        const snap = await getDocs(q)
        if(!snap.empty){
          const doc = snap.docs[0]
          const roomId = doc.id
          roomIdRef.current = roomId
          await registerParticipant(roomId, assignedUid, displayName || 'Anonymous')

          // listen to participants and update participants list
          const unsub = listenParticipants(roomId, ps=> setParticipants(ps))
          // store unsub so we can cleanup
          clientRef.current._participantsUnsub = unsub
        }
      }catch(e){
        console.warn('participant registration skipped', e)
      }

      // listen for mute flags targeted to this uid
      try{
        const { db } = initFirebaseClient()
        const { doc, onSnapshot } = await import('firebase/firestore')
        if(roomIdRef.current){
          const pdoc = doc(db, 'rooms', roomIdRef.current, 'participants', String(assignedUid))
          const unsubMute = onSnapshot(pdoc, snap=>{
            const data = snap.data()
            if(data && data.isMuted){
              // remote requested mute — mute local mic
              if(localAudioTrackRef.current) localAudioTrackRef.current.setEnabled(false)
              setMuted(true)
            }
          })
          clientRef.current._muteUnsub = unsubMute
        }
      }catch(e){ console.warn('mute listener skipped', e) }

    }catch(err){
      console.error('join error', err)
      alert('Failed to join room: '+(err.message||err))
    }
  }

  async function leave(){
    const client = clientRef.current
    try{
      if(localAudioTrackRef.current){
        localAudioTrackRef.current.close()
        localAudioTrackRef.current = null
      }
      if(client){
        if(client._participantsUnsub) client._participantsUnsub()
        if(client._muteUnsub) client._muteUnsub()
        await client.unpublish()
        await client.leave()
        clientRef.current = null
      }
    }catch(e){ console.warn(e) }
    setJoined(false)
    setRemoteUsers([])
    setParticipants([])
  }

  async function toggleMute(){
    if(!localAudioTrackRef.current) return
    if(muted){
      await localAudioTrackRef.current.setEnabled(true)
      setMuted(false)
      // clear isMuted flag in firestore for this participant
      if(roomIdRef.current && uidRef.current){
        await setParticipantMute(roomIdRef.current, uidRef.current, false)
      }
    }else{
      await localAudioTrackRef.current.setEnabled(false)
      setMuted(true)
      if(roomIdRef.current && uidRef.current){
        await setParticipantMute(roomIdRef.current, uidRef.current, true)
      }
    }
  }

  async function toggleMuteOther(participant){
    // only host should call this — quick check: compare owner
    try{
      const roomDoc = await getRoom(roomIdRef.current)
      const { auth } = initFirebaseClient()
      const myUid = auth.currentUser?.uid
      if(!roomDoc) return alert('room not found')
      if(roomDoc.owner && roomDoc.owner !== myUid) return alert('only host can mute others')
      await setParticipantMute(roomIdRef.current, participant.uid, !participant.isMuted)
    }catch(e){ console.error(e) }
  }

  return (
    <div className="border p-4 rounded">
      <div className="mb-4">
        {!joined ? (
          <>
            <input className="border p-2 mr-2" placeholder="Display name" value={displayName} onChange={e=>setDisplayName(e.target.value)} />
            <button onClick={join} className="bg-blue-600 text-white px-3 py-2 rounded">Join Voice</button>
          </>
        ) : (
          <>
            <button onClick={toggleMute} className="mr-2 bg-yellow-500 text-white px-3 py-2 rounded">{muted ? 'Unmute' : 'Mute'}</button>
            <button onClick={leave} className="bg-red-600 text-white px-3 py-2 rounded">Leave</button>
          </>
        )}
      </div>

      <div>
        <h3 className="font-semibold">Participants</h3>
        <ul className="mt-2">
          {participants.map(p=> (
            <li key={p.uid} className="flex justify-between items-center">
              <div>
                <span className="font-medium">{p.displayName}</span>
                {p.uid===uidRef.current && <span className="text-xs text-gray-500"> (You)</span>}
                {p.isMuted && <span className="text-xs text-red-500 ml-2">muted</span>}
              </div>
              <div>
                <button onClick={()=>toggleMuteOther(p)} className="text-sm px-2 py-1 bg-gray-200 rounded">Toggle mute</button>
              </div>
            </li>
          ))}
          {participants.length===0 && <li>Not connected</li>}
        </ul>
      </div>
    </div>
  )
}
