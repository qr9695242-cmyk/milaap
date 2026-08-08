// app/rooms/[roomId]/page.jsx
import React from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

const VoiceRoom = dynamic(() => import('../../../components/VoiceRoom'), { ssr: false })

export default function RoomPage({ params }){
  const { roomId } = params
  return (
    <div className="p-6">
      <div className="mb-4"><Link href="/rooms">← Back to rooms</Link></div>
      <h1 className="text-2xl font-bold mb-4">Room: {roomId}</h1>
      <VoiceRoom channel={roomId} />
    </div>
  )
}
