
const moment = require('moment')

window.moment = moment

// --------------------------------------------------------
function niceName(interval) {
	return (
		interval
			.replace(/(\b|\d)d\b/, '$1 days')
			.replace(/(\b|\d)min\b/, '$1 minutes')
			.replace(/^1 (\w*)s$/, '1 $1')
	)
}
// --------------------------------------------------------
// how many of what are in the given interval
function grok(interval) {
	const bits = interval.match(/^(\d+)(\w+)$/)
	let unit = {
		'd': 'days',
		'min': 'minutes',
		'y': 'years'
	}[bits[2]]
	count = parseInt(bits[1], 10)
	return { unit, count }
}
// --------------------------------------------------------
// is date1 before date2?
function isBefore(date1, date2) {
	const d1 = date1 ? moment(date1) : moment()
	const d2 = date2 ? moment(date2) : moment()
	return d1.isBefore(d2)
}
// --------------------------------------------------------
// is date1 after date2?
function isAfter(date1, date2) {
	const d1 = date1 ? moment(date1) : moment()
	const d2 = date2 ? moment(date2) : moment()
	return d1.isAfter(d2)
}
// --------------------------------------------------------
// earliest of two dates
function earliest(date1, date2) {
	const d1 = date1 ? moment(date1) : moment()
	const d2 = date2 ? moment(date2) : moment()
	if (d1.isBefore(d2)) { return d1 }
	return d2
}
// --------------------------------------------------------
// latest of two dates
function latest(date1, date2) {
	const d1 = date1 ? moment(date1) : moment()
	const d2 = date2 ? moment(date2) : moment()
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
	return moment(datesInterval).add(1, 'd')
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
	const unit = grok(interval).unit
	if (unit === 'minutes') {
		return moment(date).format('YYYY-MM-DD HH:mm')
	}
	if (unit === 'days') {
		return moment(date).format('YYYY-MM-DD')
	}
	if (unit === 'years') {
		return moment(date).format('YYYY')
	}
}
// --------------------------------------------------------
// return dates fromDate -> toDate in steps of interval
function listDates(fromDate, toDate, interval) {
	const int = grok(interval)
	let list = []
	let timePoint = startOfInterval(fromDate, interval)
	let endPoint = startOfInterval(toDate, interval)

	list.push(timePoint.format())
	while (timePoint.isBefore(endPoint)) {
		timePoint.add(int.count, int.unit) // increment by one interval
		list.push(timePoint.format())
	}
	if (intervalName(toDate, interval) !== intervalName(list[list.length - 1], interval)) {
		list.push(endPoint.format())
	}
	return list
}
// --------------------------------------------------------
// return Plotly rangeselector settings for that interval
function toRangeSelector(interval, label) {

	const int = grok(interval)
	const name = label || niceName(interval)

	if (int.unit === 'days') {
		return {
			step: 'day',
			stepmode: 'backward',
			count: int.count,
			label: niceName(interval)
		}
	}

	if (int.unit === 'years') {
		return {
			step: 'year',
			stepmode: 'backward',
			count: int.count,
			label: niceName(interval)
		}
	}

	return false
}
// --------------------------------------------------------
// --------------------------------------------------------

module.exports = {
	niceName,
	windBack, windForward,
	isBefore, isAfter,
	earliest, latest,
	intervalName,
	listDates,
	toRangeSelector
}