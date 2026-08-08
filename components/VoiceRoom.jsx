// components/VoiceRoom.jsx
'use client'
import React, { useEffect, useState, useRef } from 'react'
import { createClient, createMicrophoneAndCameraTracks } from 'agora-rtc-sdk-ng'

export default function VoiceRoom({ channel }){
  const [joined, setJoined] = useState(false)
  const [muted, setMuted] = useState(false)
  const [remoteUsers, setRemoteUsers] = useState([])
  const clientRef = useRef(null)
  const localAudioTrackRef = useRef(null)
  const uidRef = useRef(null)

  useEffect(()=>{
    return ()=>{ // cleanup on unmount
      leave().catch(()=>{})
    }
  },[])

  async function getTokenAndUid(){
    // request token from server
    const resp = await fetch('/api/agora-token', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ channel }) })
    if(!resp.ok) throw new Error('token error')
    const data = await resp.json()
    return data
  }

  async function join(){
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
      // createMicrophoneAndCameraTracks returns [audioTrack, videoTrack]
      localAudioTrackRef.current = microphoneTrack
      await client.publish([microphoneTrack])
      setJoined(true)
      setMuted(false)
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
        await client.unpublish()
        await client.leave()
        clientRef.current = null
      }
    }catch(e){ console.warn(e) }
    setJoined(false)
    setRemoteUsers([])
  }

  async function toggleMute(){
    if(!localAudioTrackRef.current) return
    if(muted){
      await localAudioTrackRef.current.setEnabled(true)
      setMuted(false)
    }else{
      await localAudioTrackRef.current.setEnabled(false)
      setMuted(true)
    }
  }

  return (
    <div className="border p-4 rounded">
      <div className="mb-4">
        {!joined ? (
          <button onClick={join} className="bg-blue-600 text-white px-3 py-2 rounded">Join Voice</button>
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
          {joined && <li key="me">You (uid: {uidRef.current||'—'})</li>}
          {remoteUsers.map(u=> <li key={u.uid}>User {u.uid}</li>)}
          {remoteUsers.length===0 && !joined && <li>Not connected</li>}
        </ul>
      </div>
    </div>
  )
}
