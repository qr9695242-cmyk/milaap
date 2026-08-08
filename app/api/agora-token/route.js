// app/api/agora-token/route.js
import { NextResponse } from 'next/server'
import { RtcTokenBuilder, RtcRole } from 'agora-access-token'

export async function POST(req){
  try{
    const body = await req.json()
    const channelName = body.channel
    if(!channelName) return NextResponse.json({ error: 'missing channel' }, { status:400 })

    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID
    const appCertificate = process.env.AGORA_APP_CERTIFICATE
    if(!appId || !appCertificate) return NextResponse.json({ error: 'server not configured' }, { status:500 })

    // generate a random uid (number)
    const uid = Math.floor(Math.random()*1000000)
    const expireSeconds = 60 * 10 // 10 minutes
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const privilegeExpiredTs = currentTimestamp + expireSeconds

    const token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, RtcRole.PUBLISHER, privilegeExpiredTs)

    return NextResponse.json({ token, uid })
  }catch(err){
    console.error(err)
    return NextResponse.json({ error: 'internal' }, { status:500 })
  }
}
