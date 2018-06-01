
const moment = require('moment')

// --------------------------------------------------------
function niceName(interval) {
	return (
		interval
			.replace(/(\b|\d)d\b/, '$1 days')
			.replace(/^1 (\w*)s$/, '1 $1')
	)
}
// --------------------------------------------------------
// return a thingy
function grok(interval) {
	const bits = interval.match(/^(\d+)(.)$/)
	let unit = {
		'd': 'days',
		'y': 'years'
	}[bits[2]]
	count = Number.parseInt(bits[1], 10)
	return { unit, count }
}
// --------------------------------------------------------
// earliest of two dates
function earliest(date1=moment(), date2=moment()) {
	const d1 = moment(date1)
	const d2 = moment(date2)
	if (d1.isBefore(d2)) { return d1 }
	return d2
}
// --------------------------------------------------------
// latest of two dates
function latest(date1=moment(), date2=moment()) {
	const d1 = moment(date1)
	const d2 = moment(date2)
	if (d1.isBefore(d2)) { return d2 }
	return d1
}
// --------------------------------------------------------
// return a date which is /interval/ before the given date
function windBack(date, interval) {
	const int = grok(interval)
	return moment(date).subtract(int.count, int.unit).toDate()
}
// --------------------------------------------------------
// return a Plotly rangeselector button for that interval
function toRangeSelector(interval, label) {

	const { unit, count } = grok(interval)
	const name = label || niceName(interval)

	if (unit === 'days') {
		return {
			step: 'day',
			stepmode: 'backward',
			count: count,
			label: niceName(interval)
		}
	}

	if (unit === 'years') {
		return {
			step: 'year',
			stepmode: 'backward',
			count: count,
			label: niceName(interval)
		}
	}

}
// --------------------------------------------------------
// --------------------------------------------------------

module.exports = {
	niceName,
	windBack,
	earliest, latest,
	toRangeSelector
}