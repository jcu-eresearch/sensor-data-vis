
const intervals = require('./intervals')
const moment = require('moment')
const d3 = require('plotly.js').d3

const fileLocationPrefix = './data'

// --------------------------------------------------------
function getDataInfo(dataUrl = './data/sites.json') {
	return fetch(dataUrl)
		.then((response) => response.json())
		.then((data) => data.sites)
}
// --------------------------------------------------------
function datasetUrl(site, dataset, date) {

	date = moment( date ? date : [] )

	// need to turn the period into a file suffix
	const periodFormatList = {
		'all': '[all]',
		'1y': 'YYYY',
	}
	// pick the right format string
	const periodFormat = periodFormatList[dataset.period.toLowerCase()]
	// apply that format to the requested date
	const periodSuffix = date.format(periodFormat)

	return [
		fileLocationPrefix,
		site.id,
		dataset.id + '-' + periodSuffix
	].join('/') + '.csv'
}
// --------------------------------------------------------
function loadDataset(site, dataset, date) {

	const nullStrings = [
		'', 'NA', 'na', 'n/a', 'N/A', 'Not available', 'not available'
	]

	const url = datasetUrl(site, dataset, date)

	let result = new Promise( (resolve, reject) => {

		const timeField = dataset.timeid
		let data = { time: [] }

		d3.csv(url, (err, rawData) => {
			if (err) {
				reject(err)
				return
			}

			const fields = dataset.elements.map( (e) => e.id )

			fields.forEach( (f) => data[f] = [] )

			rawData.forEach( (row, i) => {
				data.time.push(moment(row[timeField]).toDate())
				fields.forEach( (f) => {
					if (nullStrings.includes(row[f])) {
						data[f].push(null)
					} else {
						data[f].push(+row[f])
					}
				})
			})

			resolve(data)
		})
	})

	return result
}
// --------------------------------------------------------
// --------------------------------------------------------

module.exports = {
	getDataInfo,
	loadDataset,
	datasetUrl
}

