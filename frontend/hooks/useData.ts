import useSWR from 'swr'
import axios from "axios"
import c from '../constants'

// @ts-ignore
export const fetcher = url => axios.get(c.serverUri + url).then(res => res.data)

const useData = (url: string) => useSWR(url, fetcher)

export default useData
