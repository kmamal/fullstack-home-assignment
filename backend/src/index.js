import express from 'express'
import cors from 'cors'
import { fetch } from 'undici'

const PORT = 3001

const DAYS = [
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
	'sunday',
]

const app = express()

app.use(cors())

app.get('/place/:id', async (req, res) => {
	const { id } = req.params

	const response = await fetch(`https://storage.googleapis.com/coding-session-rest-api/${id}`)
	if (!response.ok) {
		return res.sendStatus(response.status === 404 ? 404 : 503)
	}

	let data
	try {
		data = await response.json()

		const {
			displayed_what: name,
			displayed_where: location,
			opening_hours: openingHours,
		} = data

		return res.status(200).send({ name, location, hours: openingHours.days })
	} catch (error) {
		console.log(error)
		return res.sendStatus(503)
	}
})

app.all('*', (_, res) => res.sendStatus(404))

app.listen(PORT, () => console.log(`Listening on port ${PORT}`))
