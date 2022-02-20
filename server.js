import fetch from 'node-fetch'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'

import { logReq, logRes, getRandomInt } from './utils/index.js'

const app = express()

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const addMinutesToFlightDate = (flightDate) => {
	return new Date(new Date(flightDate).getTime() + getRandomInt(5) * 60000)
}

app.post('/LandingFlightData', (req, res) => {
	const flight = req.body.flight
	logReq('LandingFlightData', flight)

	if (flight.status === 'In Flight') {
		const updatedFlight = { ...flight, status: 'Descending' }

		logRes('LandingFlightData', updatedFlight)
		res.json(updatedFlight)
	} else if (
		flight.status === 'Descending' ||
		flight.status === 'Waiting for landing'
	) {
		const updatedFlight =
			new Date().getTime() % 2 === 0 // здесь должен быть запрос к TowerControl. Спрашиваем свободна ли полоса для посадки
				? { ...flight, status: 'Landing' }
				: {
						...flight,
						time: addMinutesToFlightDate(flight.time),
						status: 'Waiting for landing',
				  }

		logRes('LandingFlightData', updatedFlight)
		res.json(updatedFlight)
	} else if (flight.status === 'Landing') {
		const updatedFlight = { ...flight, status: 'Landed' }

		logRes('LandingFlightData', updatedFlight)
		res.json(updatedFlight)
	} else {
		logRes('LandingFlightData', flight)
		res.json(flight)
	}
})

app.post('/TakingOffFlightData', (req, res) => {
	const flight = req.body.flight
	logReq('TakingOffFlightData', flight)

	if (flight.status === 'In Airport') {
		const updatedFlight =
			new Date().getTime() % 2 === 0 // здесь должен быть запрос к TowerControl. Спрашиваем свободна ли полоса для взлёта
				? { ...flight, status: 'In Flight' }
				: {
						...flight,
						time: addMinutesToFlightDate(flight.time),
						status: 'Waiting for take off',
				  }

		logRes('TakingOffFlightData', updatedFlight)
		res.json(updatedFlight)
	} else if (flight.status === 'Waiting for take off') {
		const updatedFlight =
			new Date().getTime() % 2 === 0 // здесь должен быть запрос к TowerControl. Спрашиваем свободна ли полоса для взлёта
				? { ...flight, status: 'In Flight' }
				: {
						...flight,
						time: addMinutesToFlightDate(flight.time),
						status: 'Waiting for take off',
				  }

		logRes('TakingOffFlightData', updatedFlight)
		res.json(updatedFlight)
	} else {
		logRes('TakingOffFlightData', flight)
		res.json(flight)
	}
})

if (process.env.NODE_ENV === 'production') {
	app.use(express.static('client/build'))

	app.get('*', (_, res) => {
		res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
	})
}

const PORT = process.env.PORT || 4001
app.listen(PORT, () => console.log(`Listening on PORT ${PORT}`))
