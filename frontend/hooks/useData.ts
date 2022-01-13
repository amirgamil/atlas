import useSWR from 'swr'
import axios from "axios"

// CHANGE FOR PROD
const serverURL = "http://localhost:3001"

// @ts-ignore
const fetcher = url => axios.get(url).then(res => res.data)

const useData = (url: string) => useSWR(serverURL + url, fetcher)

export default useData
