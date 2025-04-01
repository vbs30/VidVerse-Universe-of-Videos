'use client'

import { useParams } from 'next/navigation'
import VideoComponent from '@/components/VideoComponent'

export default function VideoPage() {
    const params = useParams()
    const videoid = params.videoid as string

    return (
        <div className="container">
            <VideoComponent videoid={videoid} />
        </div>
    )
}