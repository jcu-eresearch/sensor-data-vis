
const intervals = require('./intervals')
const moment = require('moment')
const d3 = require('plotly.js').d3

// --------------------------------------------------------

const dataDescriptorUrl = './data/sites.json'
const nowSetupUrl = './data/now.json'

// const dataLocationPrefix = '//cotr.jcu.io/public'
const dataLocationPrefix = './data'

// --------------------------------------------------------
function getNowInfo(nowUrl) {
	nowUrl = nowUrl || nowSetupUrl
	return ( fetch(nowUrl)
		.then(function(response) { return response.json() }.bind(this) )
		.then(function(data) { return data.now }.bind(this) )
	)
}
// --------------------------------------------------------
function getDataInfo(dataUrl) {
	dataUrl = dataUrl || dataDescriptorUrl
	return ( fetch(dataUrl)
		.then(function(response) { return response.json() }.bind(this) )
		.then(function(data) { return data.sites }.bind(this) )
	)
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
		dataLocationPrefix,
		site.id,
		dataset.id + '_' + periodSuffix
	].join('/') + '.csv'
}
// --------------------------------------------------------
function loadDataset(site, dataset, date) {

	const nullStrings = [
		'', 'NA', 'na', 'n/a', 'N/A', 'Not available', 'not available'
	]

	const url = datasetUrl(site, dataset, date)

	let result = new Promise( function(resolve, reject) {

		const timeField = dataset.timeid
		let data = { time: [] }

		d3.csv(url, function(err, rawData) {
			if (err) {
				reject(err)
				return
			}

			const fields = dataset.elements.map( function(e) {return e.id} )

			fields.forEach( function(f) { data[f] = [] } )

			rawData.forEach( function(row, i) {
				data.time.push(moment(row[timeField]).toDate())
				fields.forEach( function(f) {
					if (nullStrings.indexOf(row[f]) !== -1) {
						data[f].push(null)
					} else {
						data[f].push(+row[f])
					}
				}.bind(this))
			}.bind(this))

			resolve(data)

		}.bind(this) )
	}.bind(this) )

	return result
}
// --------------------------------------------------------
// --------------------------------------------------------

module.exports = {
	getNowInfo,
	getDataInfo,
	loadDataset,
	datasetUrl
}

