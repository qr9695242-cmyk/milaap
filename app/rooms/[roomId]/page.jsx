// app/rooms/[roomId]/page.jsx
'use client'
import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { getRoom } from '../../../lib/firestore/rooms'

const VoiceRoom = dynamic(() => import('../../../components/VoiceRoom'), { ssr: false })

export default function RoomPage({ params }){
  const { roomId } = params
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    let mounted = true
    getRoom(roomId)
      .then(r=>{ if(mounted) setRoom(r) })
      .catch(err=>{ console.error(err); if(mounted) setRoom(null) })
      .finally(()=>{ if(mounted) setLoading(false) })
    return ()=>{ mounted = false }
  },[roomId])

  if(loading) return <div className="p-6">Loading…</div>
  if(!room) return <div className="p-6">Room not found. <Link href="/rooms">Back to rooms</Link></div>

  return (
    <div className="p-6">
      <div className="mb-4"><Link href="/rooms">← Back to rooms</Link></div>
      <h1 className="text-2xl font-bold mb-4">Room: {room.name}</h1>
      <VoiceRoom channel={room.channel} />
    </div>
  )
}
