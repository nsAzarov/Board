import fetch from 'node-fetch'
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'

import { logReq, logRes, logErr, getRandomInt } from './utils/index.js'

const app = express()

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const addMinutesToFlightDate = (flightDate) => {
	return new Date(new Date(flightDate).getTime() + getRandomInt(5) * 60000)
}

const sendWaitingForLandingFlightEvent = async (data) => {
	logReq('AddWaitingForLandingFlightEvent')
	await fetch('http://localhost:4007/AddWaitingForLandingFlightEvent', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	})
}

const sendLandingFlightEvent = async (data) => {
	logReq('AddLandingFlightEvent')
	await fetch('http://localhost:4007/AddLandingFlightEvent', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	})
}

const processDescendingBoardUpdate = async (flight) => {
	logReq('AirstripState')
	const airstripState = await (
		await fetch('http://localhost:4002/AirstripState')
	).json()
	logRes('AirstripState', airstripState)

	switch (airstripState) {
		case 'Busy':
			const time = addMinutesToFlightDate(flight.time)
			await sendWaitingForLandingFlightEvent({
				flight: flight.flight,
				time,
				status: 'Waiting for landing',
			})
			return {
				...flight,
				time,
				status: 'Waiting for landing',
			}
		case 'Free':
			await sendLandingFlightEvent({ flight: flight.flight, status: 'Landing' })
			return { ...flight, status: 'Landing' }
		default:
			logErr('Invalid airstripState')
			return flight
	}
}

app.post('/LandingFlightData', async (req, res) => {
	const flight = req.body
	logReq('LandingFlightData', flight)

	if (flight.status === 'In Flight') {
		const updatedFlight = { ...flight, status: 'Descending' }

		logRes('LandingFlightData', updatedFlight)
		res.json(updatedFlight)
	} else if (
		flight.status === 'Descending' ||
		flight.status === 'Waiting for landing'
	) {
		const updatedFlight = await processDescendingBoardUpdate(flight)

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

const sendWaitingForTakeOffFlightEvent = async (data) => {
	logReq('AddWaitingForTakeOffFlightEvent')
	await fetch('http://localhost:4007/AddWaitingForTakeOffFlightEvent', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	})
}

const sendTakingOffFlightEvent = async (data) => {
	logReq('AddTakingOffFlightEvent')
	await fetch('http://localhost:4007/AddTakingOffFlightEvent', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	})
}

const processTakingOffBoardUpdate = async (flight) => {
	logReq('AirstripState')
	const airstripState = await (
		await fetch('http://localhost:4002/AirstripState')
	).json()
	logRes('AirstripState', airstripState)

	switch (airstripState) {
		case 'Busy':
			await sendWaitingForTakeOffFlightEvent({
				flight: flight.flight,
				status: 'Waiting for take off',
				registered: flight.registered,
			})
			return {
				...flight,
				time: addMinutesToFlightDate(flight.time),
				status: 'Waiting for take off',
			}
		case 'Free':
			await sendTakingOffFlightEvent({
				flight: flight.flight,
				status: 'In Flight',
				registered: flight.registered,
			})
			return { ...flight, status: 'In Flight' }
		default:
			logErr('Invalid airstripState')
			return flight
	}
}

app.post('/TakingOffFlightData', async (req, res) => {
	let flight = req.body
	logReq('TakingOffFlightData', flight)

	logReq('CurrentTicketsState')
	const currentTicketsState = await (
		await fetch('http://localhost:4006/CurrentTicketsState')
	).json()
	logRes('CurrentTicketsState', currentTicketsState)

	const flightInRegisteredTickets = currentTicketsState.find(
		(x) => x.flight === flight.flight
	)
	if (flightInRegisteredTickets) {
		flight = { ...flight, registered: flightInRegisteredTickets.registered }
	}

	if (
		flight.status === 'In Airport' ||
		flight.status === 'Waiting for take off'
	) {
		let updatedFlight = await processTakingOffBoardUpdate(flight)

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
