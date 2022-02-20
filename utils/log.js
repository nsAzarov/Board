const MODULE_NAME = 'BOARD'

export const logReq = (requestName, data) => {
	if (data) {
		console.log(`${MODULE_NAME} | request: "/${requestName}"; data:`, data)
	} else {
		console.log(`${MODULE_NAME} | request: "/${requestName}"`)
	}
}

export const logRes = (requestName, data) => {
	if (data) {
		console.log(`${MODULE_NAME} | response: "/${requestName}"; data:`, data)
	} else {
		console.log(`${MODULE_NAME} | response: "/${requestName}"`)
	}
}

export const logErr = (data) => {
	console.log(`${MODULE_NAME} | error:`, data)
}
