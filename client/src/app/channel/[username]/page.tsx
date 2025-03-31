'use client'

import { useParams } from 'next/navigation';
import ChannelPage from '@/components/Channel';

export default function Page() {
  const params = useParams();
  return <ChannelPage params={{ username: params.username as string }} />;
}