// app/rooms/page.jsx
'use client'
import React, { useEffect, useState } from 'react'
import { listRooms, createRoom } from '../../lib/firestore/rooms'
import { initFirebaseClient, signInAnonymously } from '../../lib/firebase/client'

export default function RoomsPage(){
  const [rooms, setRooms] = useState([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [userUid, setUserUid] = useState(null)

  useEffect(()=>{
    initFirebaseClient()
    // ensure anonymous auth so we can set owner & participants
    signInAnonymously().catch(()=>{})
    let mounted = true
    listRooms().then(r=>{ if(mounted){ setRooms(r); setLoading(false)} }).catch(()=>setLoading(false))
    return ()=>{ mounted = false }
  },[])

  async function handleCreate(e){
    e.preventDefault()
    if(!name) return
    setLoading(true)
    try{
      // get auth uid if available
      const { auth } = initFirebaseClient()
      const uid = auth.currentUser?.uid || null
      const id = await createRoom(name, uid)
      setName('')
      const updated = await listRooms()
      setRooms(updated)
    }catch(err){
      console.error(err)
      alert('Failed to create room')
    }finally{ setLoading(false) }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Voice Rooms</h1>

      <form onSubmit={handleCreate} className="mb-6">
        <input className="border p-2 mr-2" value={name} onChange={e=>setName(e.target.value)} placeholder="Room name" />
        <button className="bg-blue-600 text-white px-3 py-2 rounded" type="submit">Create</button>
      </form>

      {loading ? <div>Loading…</div> : (
        <ul className="space-y-2">
          {rooms.length===0 && <li>No rooms yet</li>}
          {rooms.map(r=> (
            <li key={r.id} className="p-3 border rounded flex justify-between items-center">
              <div>
                <div className="font-semibold">{r.name}</div>
                <div className="text-sm text-gray-500">Channel: {r.channel}</div>
                {r.owner && <div className="text-xs text-gray-400">Host: {r.owner}</div>}
              </div>
              <a className="bg-green-600 text-white px-3 py-2 rounded" href={`/rooms/${r.id}`}>Join</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
