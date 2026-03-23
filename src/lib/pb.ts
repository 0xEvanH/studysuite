import PocketBase from 'pocketbase'

const url = import.meta.env.VITE_PB_URL as string

if (!url) throw new Error('Missing VITE_PB_URL in .env')

export const pb = new PocketBase(url)

pb.autoCancellation(false)
