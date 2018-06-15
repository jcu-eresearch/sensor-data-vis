
const domTools = require('./src/domtools')
const intervalTools = require('./src/intervals')
const dataImporter = require('./src/dataimport')
const colors = require('./src/colors')

const plotly = require('plotly.js/dist/plotly')
const d3 = plotly.d3

let graphholder = d3.select('#graphholder')
window.onresize = function() { plotly.Plots.resize(graphholder.node()) }

// --------------------------------------------------------
function debugMsg(msg, level) {
	level = level || 3
	if (level > 2) {
		console.log('DEBUG' + level + ': ' + msg)
	}
}
// --------------------------------------------------------
function prepareForm() {
	debugMsg('entering prepareForm', 2)
	// handle dataset change
	const siteSel = document.querySelector('#graph-instance .site-selector')
	siteSel.addEventListener('change', function(e) {
		siteSelected()
	})

	// handle resolution change
	const setSel = document.querySelector('#graph-instance .set-selector')
	setSel.addEventListener('change', function(e) {
		datasetSelected()
	})

	// handle interval change
	const intSel = document.querySelector('#graph-instance .int-selector')
	intSel.addEventListener('change', function(e) {
		intSelected()
	})
}
// --------------------------------------------------------
function populateSiteSelector(sites) {
	debugMsg('entering populateSiteSelector', 2)
	const sel = document.querySelector('#graph-instance .site-selector')

	// empty the selector
	sel.innerHTML = ''

	// add a "nothing selected" option
	sel.add(new Option('select a site...', '', true))

	// add an option for each dataset
	sites.forEach(function(site) {
		sel.add(new Option(site.name, site.id))
	}.bind(this))

	// un-disable the selector's parent fieldset
	let fieldsetParent = domTools.findParent(sel, 'fieldset')
	domTools.removeClass(fieldsetParent, 'disabled')

	// // if there's just one site option, click it now
	// if (sites.length === 1) {
	// 	domTools.selectOption(sel, sites[0].id)
	// 	domTools.addClass(fieldsetParent, 'hidden')
	// }
}
// --------------------------------------------------------
function siteSelected() {
	debugMsg('entering siteSelected', 2)
	const sel = document.querySelector('#graph-instance .site-selector')
	const siteid = sel.value
	current.site = sites.filter(function(site) {return site.id === siteid })[0]

	// make sure the "select a site" thing is disabled now
	sel.options.item(0).disabled = true

	clearGraphs()
	clearDownload()
	populateDatasetSelector(current.site.datasets)
	clearIntervalSelector()
	clearFieldSelector()
}
// --------------------------------------------------------
function populateDatasetSelector(datasets) {
	debugMsg('entering populateDatasetSelector', 2)
	const sel = document.querySelector('#graph-instance .set-selector')
	sel.innerHTML = ''
	sel.add(new Option('select a dataset...', '', true))

	// add an option for each resolution
	datasets.forEach(function(ds) {
		sel.add(new Option(ds.name, ds.id))
	})
	let fieldsetParent = domTools.findParent(sel, 'fieldset')
	domTools.removeClass(fieldsetParent, 'disabled')

}
// --------------------------------------------------------
function datasetSelected() {
	debugMsg('entering datasetSelected', 2)
	const sel = document.querySelector('#graph-instance .set-selector')
	const setid = sel.value
	current.dataset = current.site.datasets.filter(function(set) { return set.id === setid })[0]

	// make sure the "select a dataset" thing is disabled now
	sel.options.item(0).disabled = true

	populateIntervalSelector(current.dataset)
	populateFieldSelector(current.dataset)
}
// --------------------------------------------------------
function clearIntervalSelector(dataset) {
	debugMsg('entering clearIntervalSelector', 2)
	const lab = document.querySelector('#graph-instance .int-label')
	const sel = document.querySelector('#graph-instance .int-selector')
	sel.innerHTML = ''
	domTools.addClass(lab, 'hidden')
}
// --------------------------------------------------------
function populateIntervalSelector(dataset) {
	debugMsg('entering populateIntervalSelector', 2)

	const lab = document.querySelector('#graph-instance .int-label')
	const sel = document.querySelector('#graph-instance .int-selector')

	sel.innerHTML = ''

	if (dataset.period === 'all') {
		// if there's no intervals, clean up then bail out
		current.date = (new Date).toISOString()
		domTools.addClass(lab, 'hidden')
		loadDataAndMakeGraphs()
		return
	}

	//
	// so there's intervals for the user to choose from.
	// Let's make a list of them.
	//
	const start = dataset.elements.reduce(
		function(first, elem) { return intervalTools.earliest(first, elem.start) },
		new Date('9999-12-31')
	)
	const end = dataset.elements.reduce(
		function(last, elem) { return intervalTools.latest(last, (elem.end || new Date())) },
		new Date('0000-01-01')
	)

	const intervals = intervalTools.listDates(start, end, dataset.period)

	// add an option for each interval
	intervals.forEach(function(int) {
		sel.add(new Option(intervalTools.intervalName(int, dataset.period), int))
	})
	domTools.selectOption(sel, intervals[intervals.length - 1])

	domTools.removeClass(lab, 'hidden')
}
// --------------------------------------------------------
function intSelected() {
	debugMsg('entering intSelected', 2)
	const sel = document.querySelector('#graph-instance .int-selector')
	current.date = sel.value

	loadDataAndMakeGraphs()
}
// --------------------------------------------------------
function clearFieldSelector() {
	debugMsg('entering clearFieldSelector', 2)
	const fs = document.querySelector('#graph-instance .field-selectors')
	fs.innerHTML = ''
	domTools.addClass(fs, 'hidden')
}
// --------------------------------------------------------
function populateFieldSelector(dataset) {
	debugMsg('entering populateFieldSelector', 2)
	const fs = document.querySelector('#graph-instance .field-selectors')
	fs.innerHTML = ''

	const crel = document.createElement.bind(document) // save typing
	const crtx = document.createTextNode.bind(document) // save typing

	if (dataset.defaultgraph) {
		current.graph = dataset.defaultgraph.sort()
	} else {
		current.graph = dataset.elements.map(function(e) { return e.id })
	}

	dataset.elements.forEach( function(f) {
		const label = crel('label')
		const checkbox = crel('input')
		checkbox.type = 'checkbox'
		checkbox.value = f.id
		checkbox.checked = (current.graph.indexOf(f.id) !== -1)
		label.appendChild(checkbox)
		label.appendChild(crtx(f.name))
		fs.appendChild(label)
		checkbox.addEventListener('change', function(e) {
			fieldSelected()
		})
	})

	domTools.removeClass(fs, 'hidden')
}
// --------------------------------------------------------
function fieldSelected() {
	debugMsg('entering fieldSelected', 2)
	const fs = document.querySelector('#graph-instance .field-selectors')

	const fields = fs.querySelectorAll('input[type=checkbox]:checked')

	current.graph = Array.apply(0, fields).map(function(f){ return f.value }).sort()

	drawGraphs()
}
// --------------------------------------------------------
function showLoading(message) {
	debugMsg('entering showLoading', 2)
	message = message || 'loading'
	const fs = document.querySelector('#graph-instance .loading')
	fs.innerHTML = message
	domTools.removeClass(fs, 'clear')
	setTimeout( function() { fs.innerHTML = message }, 1000)
}
// --------------------------------------------------------
function clearLoading() {
	debugMsg('entering clearLoading', 2)
	const fs = document.querySelector('#graph-instance .loading')
	domTools.addClass(fs, 'clear')
	setTimeout( function() { fs.innerHTML = '' }, 1000)
}
// --------------------------------------------------------
function showDownload() {
	debugMsg('entering showDownload', 2)
	const lab = document.querySelector('#graph-instance .download-label')
	const dl = document.querySelector('#graph-instance .download-link')
	dl.href = dataImporter.datasetUrl(current.site, current.dataset, current.date)
	domTools.removeClass(lab, 'hidden')
}
// --------------------------------------------------------
function clearDownload() {
	debugMsg('entering clearDownload', 2)
	const lab = document.querySelector('#graph-instance .download-label')
	const dl = document.querySelector('#graph-instance .download-link')
	dl.href = ''
	domTools.addClass(lab, 'hidden')
}
// --------------------------------------------------------
function clearGraphs() {
	debugMsg('entering clearGraphs', 2)
	// clear out the graph hholding div
	graphholder.node().innerHTML = ''
}
// --------------------------------------------------------
function loadDataAndMakeGraphs() {
	debugMsg('entering loadDataAndMakeGraphs', 2)
	showLoading('loading data')
	showDownload()
	let dataLoadProcess = dataImporter.loadDataset(
		current.site, current.dataset, current.date
	).then(function(data) {
		current.data = data
		clearLoading()
	}).catch(function(err) {
		const dataDesc = [
			current.site.id,
			current.dataset.id,
			intervalTools.intervalName(current.date, current.dataset.period)
		].join(' / ')
		current.data = null
		alert('\nThere was a problem!\n\n'
			+ 'Data for ' + dataDesc + ' is not available.'
		)
		clearLoading()
	})

	current.loadProcess = dataLoadProcess

	drawGraphs()
}
// --------------------------------------------------------
function drawGraphs() {
	debugMsg('entering drawGraphs', 2)

	clearGraphs()

	// can only graph when everything is loaded..
	current.loadProcess.then( function() {

		const ds = current.dataset // just for typing convenience

		fields = current.graph // selected fields

		// get all the subgraphs ready -- if there are
		// fields that share an axis type, they will share
		// a single subgraph.
		sgIndex = 1
		let subgraphs = {}
		let traces = []
		// also, while we're looping through fields,
		// keep track of the latest date we've seen
		let latestDate = '1800-01-01'

		fields.forEach( function(f) {

			latestDate = intervalTools.latest(latestDate, current.data.time[current.data.time.length - 1])

			// okay now get the field
			let field = null
			ds.elements.forEach( function(c) {
				if (c.id === f) {
					field = c
				}
			}.bind(this))
			// let field = ds.elements.find( function(c) { return c.id === f }.bind(this) )

			// make sure there's a subgraph for it
			if (!subgraphs[field.axis]) {
				let sg = { index: sgIndex, layoutFields: [] }
				if (sgIndex > 1) {
					sg.layoutFields.push(['xaxis' + sgIndex, { anchor: 'y' + sgIndex }])
				}
				sg.layoutFields.push(['yaxis' + sgIndex, {
					showspikes: true,
					spikethickness: 1,
					spikedash: 'dot',
					title: field.axis.replace(' (', '<br>(')
				}])
				// sg.layoutFields.push(['title', field.axis])
				subgraphs[field.axis] = sg
				sgIndex += 1
			}

			// now describe the trace for this field
			traces.push({
				x: current.data.time,
				y: current.data[f],
				name: field.name,
				connectgaps: true,
				type: 'scatter',
				// type: 'scattergl',
				mode: 'line',
				line: {
					color: colors.pickColor(f),
					width: 2
				},
				xaxis: 'x',
				yaxis: 'y' + subgraphs[field.axis].index
			})

		}.bind(this))

		//
		// now we've prepped data as necessary.. get the
		// layout stuff ready.
		//

		// buttons for setting the range
		const rangeButtons = ds.intervals.map( function(i) {
			return intervalTools.toRangeSelector(i)
		})

		const startingRange = [
			intervalTools.windBack(latestDate, ds.intervals[0]),
			latestDate.toDate()
		]

		let layout = {
			legend: {
				orientation: 'h',
				xanchor: 'center',
				tracegroupgap: 20,
				x: 0.5,
				y: 1.1
			},
			xaxis: {
				showspikes: true,
				spikethickness: 1,
				spikedash: 'dot',
				anchor: 'y',
				rangeselector: {
					y: -0.1,
					x: 1,
					xanchor: 'right',
					yanchor: 'top',
					buttons: rangeButtons
				},
				rangeslider: {
					autorange: true,
					thickness: 0.05,
					bgcolor: '#def'
				},
				range: startingRange,
				type: 'date'
			},
			margin: { t:40, b:40 }
		}

		const width = 1 / (sgIndex-1)
		const gap = 0.066
		// Object.values(subgraphs).forEach( function(g) {
		for (k in subgraphs) {
			const g = subgraphs[k]
			g.layoutFields.forEach( function(lf) {
				layout[lf[0]] = lf[1]

				// add the domain
				// if (lf[0].startsWith('yaxis')) {
				if (lf[0].substr(0,5) === 'yaxis') {
					layout[lf[0]].domain = [
						(g.index-1) * width + gap,
						g.index * width
					]
				}
			}.bind(this))
		}

		const options = {
			displaylogo: false,
			modeBarButtonsToRemove: [
				'hoverClosestCartesian',
				'hoverCompareCartesian',
				'toggleSpikelines'
			]
		}

		plotly.newPlot(
			graphholder.node(),
			traces,
			layout,
			options
		)
	}.bind(this))

}
// --------------------------------------------------------
// --------------------------------------------------------
prepareForm()
clearLoading()

let sites = []
const emptyPromise = new Promise(function(resolve) { resolve(false) } )
let current = {
	loadProcess: emptyPromise,

	site: null,
	dataset: null,
	interval: null,
	date: null,
	graph: [],

	data: null
}

showLoading('discovering datasets')
importProcess = dataImporter.getDataInfo().then(function(siteList) {
	// succeed
	sites = siteList
	populateSiteSelector(sites)
	clearLoading()
}.bind(this), function(error) {
	// fail
	alert('\nThere was a problem!'
		+ '\n\nTried fetching information about datasets but could not find it.'
		+ '\nReload this page to try again.\n\n'
		+ error
	)
	clearLoading()
}.bind(this))




