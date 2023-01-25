import { useState, useEffect } from 'react'
import './App.css'

const capitalize = (str) => `${str[0].toUpperCase()}${str.slice(1)}`

export default function App({ placeId }) {
  const [ place, setPlace ] = useState()
  const [ error, setError ] = useState()

  useEffect(() => {
    const ac = new AbortController()

    const fetch = async () => {
      const response = await window.fetch(`http://localhost:3001/place/${placeId}`, {
        signal: ac.signal,
      }).catch((error) => { if (error.name !== 'AbortError') { throw error } })
      if (!response.ok) { throw new Error(`unexpected status code ${response.status}`) }
      if (ac.aborted) { return }
      setPlace(await response.json())
    }
    fetch().catch(setError)
    return () => { ac.abort() }
  }, [ placeId, setError ])

  if (error) { return ( <div className="loading">Error!</div> ) }
  if (!place) { return ( <div className="loading">Loading...</div> ) }

  return (
    <div className="place">
      <div className="page leftPage">
        <h1 className="name">{place.name}</h1>
        <p className="location">{place.location}</p>
      </div>
      <div className="page rightPage">
        <h3 className="name">{"Opening Hours"}</h3>
        <div className="schedule">
        {
          place.hours.map(({ day, until, hours }) => {
            const ranges = hours
              ? hours.split(',').map((range) => range.split('-').join(' - '))
              : [ 'closed' ]

            return (
              <>
                <div className="day">{`${capitalize(day)}${until ? ` - ${capitalize(until)}` : ''}`}</div>
                <div className="ranges">
                {
                  ranges.map((range) => (<div className='range' key={range}>{range}</div>))
                }
                </div>
              </>
            )
          })
        }
        </div>
      </div>
    </div>
  )
}
