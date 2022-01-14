import useSWR from 'swr'
import axios from "axios"

// CHANGE FOR PROD
const serverURL = "http://localhost:3001"

// @ts-ignore
export const fetcher = url => axios.get(serverURL + url).then(res => res.data)

const useData = (url: string) => useSWR(url, fetcher)

export default useData
