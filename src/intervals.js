
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
// how many of what are in the given interval
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
// return a date which is /interval/ after the given date
function windBack(date, interval) {
	const int = grok(interval)
	return moment(date).subtract(int.count, int.unit).toDate()
}
// --------------------------------------------------------
// return an new date at the start of the given date's interval
function startOfInterval(date, interval) {
	const datesInterval = intervalName(date, interval)
	return moment(datesInterval)
}
// --------------------------------------------------------
// return a date which is /interval/ before the given date
function windForward(date, interval) {
	const int = grok(interval)
	return moment(date).add(int.count, int.unit).toDate()
}
// --------------------------------------------------------
// return a formatted string describing the interval
// the given date falls within
function intervalName(date, interval) {
	const { unit } = grok(interval)
	if (unit === 'days') {
		return moment(date).format('YYYY-MM-DD')
	}
	if (unit === 'years') {
		return moment(date).format('YYYY')
	}
}
// --------------------------------------------------------
// return dates from -> to in steps of interval
function listDates(from, to, interval) {
	const { unit, count } = grok(interval)
	let list = []
	let timePoint = startOfInterval(from, interval)
	let endPoint = startOfInterval(to, interval)

	list.push(timePoint.format())
	while (timePoint.isBefore(endPoint)) {
		timePoint.add(count, unit) // increment by one interval
		list.push(timePoint.format())
	}
	return list
}
// --------------------------------------------------------
// return Plotly rangeselector settings for that interval
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
	windBack, windForward,
	earliest, latest,
	intervalName,
	listDates,
	toRangeSelector
}