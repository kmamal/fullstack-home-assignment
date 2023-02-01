import React, { useState, useEffect } from 'react'
import './App.css'

const capitalize = (str) => `${str[0].toUpperCase()}${str.slice(1)}`

const jsDayNames = [
  'sunday',
  'monday',
  'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
]

const displayDayNames = [
  'monday',
  'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
  'sunday',
]

const timeStringLess = (a, b) => {
  if (a === '00:00') { return false }
  if (b === '00:00') { return true }
  return a < b
}

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
      const result = await response.json()
      setPlace(result)
    }
    fetch().catch(setError)
    return () => { ac.abort() }
  }, [ placeId, setError ])

  if (error) { return ( <div className="loading">Error!</div> ) }
  if (!place) { return ( <div className="loading">Loading...</div> ) }

  const date = new Date()
  // const offset = date.getTimezoneOffset()
  const originalMinutes = date.getMinutes()
  date.setMinutes(originalMinutes + (8 + 3 * 24) * 60)

  const day = date.getDay()
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`

  let isOpenNow = false
  let nextClosingTime
  let nextOpeningDayTime

  const dayName = jsDayNames[day]
  let currentDayHours = place.hours[dayName] ?? []
  if (currentDayHours) {
    for (const { start, end } of currentDayHours) {
      if (start <= time && (end === '00:00' || time < end)) {
        isOpenNow = true
        nextClosingTime = end
      }
    }
  }

  if (!isOpenNow) {
    for (const { start } of currentDayHours) {
      if (time < start) {
        nextOpeningDayTime = { day: dayName, time: start }
        break
      }
    }

    if (!nextOpeningDayTime) {
      for (let i = 1; i <= 6; i++) {
        const otherDay = (day + i) % 7
        const otherDayName = jsDayNames[otherDay]
        const otherDayHours = place.hours[otherDayName]
        if (otherDayHours) {
          nextOpeningDayTime = { day: otherDayName, time: otherDayHours[0].start }
          break
        }
      }
    }
  }

  console.log( place.hours)

  const daysWithHours = []
  for (const day of displayDayNames) {
    const ranges = place.hours[day]
    if (!ranges) {
      daysWithHours.push({ day })
      continue
    }

    ranges.sort((a, b) => a.start < b.start ? -1 : 1)
    const hours = ranges.map(({ start, end}) => `${start}-${end}`).join(',')

    const prev = daysWithHours.at(-1)
    if (prev && hours === prev.hours) {
      prev.until = day
      continue
    }

    daysWithHours.push({ day, hours })
  }

  return (
    <div className="place">
      <div className="page leftPage">
        <h1 className="name">{place.name}</h1>
        <p className="location">{place.location}</p>
      </div>
      <div className="page rightPage">
        <h3 className="name">{"Opening Hours"}</h3>
        <h4 className={isOpenNow ? 'is-open' : 'is-closed'}>
          {isOpenNow
            ? `Currently open.Closes at ${nextClosingTime}`
            : `Currently closed. Opens${
              nextOpeningDayTime.day !== dayName ? ` ${capitalize(nextOpeningDayTime.day)}` : ""
            } at ${nextOpeningDayTime.time}`
          }
        </h4>
        <div className="schedule">
        {
          daysWithHours.map(({ day, until, hours }, i) => {
            const ranges = hours
              ? hours.split(',').map((range) => range.split('-').join(' - '))
              : [ 'closed' ]

            return (
              <React.Fragment key={i}>
                <div key={`day-${i}`} className="day">{`${capitalize(day)}${until ? ` - ${capitalize(until)}` : ''}`}</div>
                <div key={`range-${i}`} className="ranges">
                {
                  ranges.map((range) => (<div className='range' key={range}>{range}</div>))
                }
                </div>
              </React.Fragment>
            )
          })
        }
        </div>
      </div>
    </div>
  )
}
