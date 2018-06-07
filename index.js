
const domTools = require('./src/domtools')
const intervalTools = require('./src/intervals')
const dataImporter = require('./src/dataimport')
const colors = require('./src/colors')

window.colors = colors

const plotly = require('plotly.js')

const d3 = plotly.d3

let graphholder = d3.select('#graphholder')

window.onresize = () => plotly.Plots.resize(graphholder.node())

// --------------------------------------------------------
function prepareForm() {
	// handle dataset change
	const siteSel = document.querySelector('#graph-instance .site-selector')
	siteSel.addEventListener('change', (e)=> {
		siteSelected()
	})

	// handle resolution change
	const setSel = document.querySelector('#graph-instance .set-selector')
	setSel.addEventListener('change', (e)=> {
		datasetSelected()
	})

	// handle interval change
	const intSel = document.querySelector('#graph-instance .int-selector')
	intSel.addEventListener('change', (e)=> {
		intSelected()
	})
}
// --------------------------------------------------------
function populateSiteSelector(sites) {
	const sel = document.querySelector('#graph-instance .site-selector')

	// empty the selector
	sel.innerHTML = ''

	// add a "nothing selected" option that is disabled
	sel.append(new Option('select a site...', '', true))
	sel.options.item(0).disabled = true
	// add an option for each dataset
	sites.forEach((site)=> {
		sel.append(new Option(site.name, site.id))
	})

	// un-disable the selector's parent fieldset
	let fieldsetParent = domTools.findParent(sel, 'fieldset')
	domTools.removeClass(fieldsetParent, 'disabled')

	// if there's just one site option, click it now
	if (sites.length === 1) {
		domTools.selectOption(sel, sites[0].id)
		domTools.addClass(fieldsetParent, 'hidden')
	}
}
// --------------------------------------------------------
function siteSelected() {
	const sel = document.querySelector('#graph-instance .site-selector')
	const siteid = sel.value
	current.site = sites.filter((site)=> site.id === siteid)[0]
	clearGraphs()
	populateDatasetSelector(current.site.datasets)
	clearIntervalSelector()
	clearFieldSelector()
}
// --------------------------------------------------------
function populateDatasetSelector(datasets) {
	const sel = document.querySelector('#graph-instance .set-selector')
	sel.innerHTML = ''
	sel.append(new Option('select a dataset...', '', true))
	sel.options.item(0).disabled = true
	// add an option for each resolution
	datasets.forEach((ds)=> {
		sel.append(new Option(ds.name, ds.id))
	})
	let fieldsetParent = domTools.findParent(sel, 'fieldset')
	domTools.removeClass(fieldsetParent, 'disabled')
}
// --------------------------------------------------------
function datasetSelected() {
	const sel = document.querySelector('#graph-instance .set-selector')
	const setid = sel.value
	current.dataset = current.site.datasets.filter((set)=> set.id === setid)[0]

	populateIntervalSelector(current.dataset)
	populateFieldSelector(current.dataset)
}
// --------------------------------------------------------
function clearIntervalSelector(dataset) {
	const lab = document.querySelector('#graph-instance .int-label')
	const sel = document.querySelector('#graph-instance .int-selector')
	sel.innerHTML = ''
	domTools.addClass(lab, 'hidden')
}
// --------------------------------------------------------
function populateIntervalSelector(dataset) {

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
		(first, elem)=> intervalTools.earliest(first, elem.start),
		new Date('9999-12-31')
	)
	const end = dataset.elements.reduce(
		(last, elem)=> intervalTools.latest(last, (elem.end || new Date())),
		new Date('0000-01-01')
	)

	const intervals = intervalTools.listDates(start, end, dataset.period)

	console.log(start, end, intervals)

	//
	// add an option for each interval
	intervals.forEach((int)=> {
		sel.append(new Option(intervalTools.intervalName(int, dataset.period), int))
	})
	domTools.selectOption(sel, intervals[intervals.length - 1])

	domTools.removeClass(lab, 'hidden')
}
// --------------------------------------------------------
function intSelected() {
	const sel = document.querySelector('#graph-instance .int-selector')
	current.date = sel.value

	loadDataAndMakeGraphs()
}
// --------------------------------------------------------
function clearFieldSelector() {
	const fs = document.querySelector('#graph-instance .field-selectors')
	fs.innerHTML = ''
	domTools.addClass(fs, 'hidden')
}
// --------------------------------------------------------
function populateFieldSelector(dataset) {
	const fs = document.querySelector('#graph-instance .field-selectors')
	fs.innerHTML = ''

	const crel = document.createElement.bind(document) // save typing
	const crtx = document.createTextNode.bind(document) // save typing

	if (dataset.defaultgraph) {
		current.graph = dataset.defaultgraph.sort()
	} else {
		current.graph = dataset.elements.map(e => e.id)
	}

	dataset.elements.forEach( (f) => {
		const label = crel('label')
		const checkbox = crel('input')
		checkbox.type = 'checkbox'
		checkbox.value = f.id
		checkbox.checked = (current.graph.includes(f.id))
		label.appendChild(checkbox)
		label.appendChild(crtx(f.name))
		fs.appendChild(label)
		checkbox.addEventListener('change', (e)=> {
			fieldSelected()
		})
	})

	domTools.removeClass(fs, 'hidden')
}
// --------------------------------------------------------
function fieldSelected() {
	const fs = document.querySelector('#graph-instance .field-selectors')

	const fields = fs.querySelectorAll('input[type=checkbox]:checked')

	current.graph = Array.from(fields).map((f)=> f.value).sort()

	drawGraphs()
}
// --------------------------------------------------------
function showLoading(message='loading') {
	const fs = document.querySelector('#graph-instance .loading')
	fs.innerHTML = message
	domTools.removeClass(fs, 'clear')
	setTimeout( ()=> fs.innerHTML = message, 1000)
}
// --------------------------------------------------------
function clearLoading() {
	const fs = document.querySelector('#graph-instance .loading')
	domTools.addClass(fs, 'clear')
	setTimeout( ()=> fs.innerHTML = '', 1000)
}
// --------------------------------------------------------
function clearGraphs() {
	// clear out the graph hholding div
	graphholder.node().innerHTML = ''
}
// --------------------------------------------------------
function loadDataAndMakeGraphs() {
	showLoading('loading data')
	let dataLoadProcess = dataImporter.loadDataset(
		current.site, current.dataset, current.date
	).then((data)=> {
		current.data = data
	}).catch((err)=> {
		const dataDesc = [
			current.site.id,
			current.dataset.id,
			intervalTools.intervalName(current.date, current.dataset.period)
		].join(' / ')
		current.data = null
		alert('\nThere was a problem!\n\n'
			+ 'Data for ' + dataDesc + ' is not available.'
		)
	}).finally( ()=> clearLoading() )

	current.loadProcess = dataLoadProcess

	drawGraphs()
}
// --------------------------------------------------------
function drawGraphs() {

	clearGraphs()

	// can only graph when everything is loaded..
	current.loadProcess.then( ()=> {

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

		fields.forEach( (f) => {
			latestDate = intervalTools.latest(latestDate, current.data.time[current.data.time.length - 1])

			// okay now get the field
			let field = ds.elements.find( c => c.id === f )

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
		})

		//
		// now we've prepped data as necessary.. get the
		// layout stuff ready.
		//

		// buttons for setting the range
		const rangeButtons = ds.intervals.map( (i)=> {
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
		Object.values(subgraphs).forEach( (g)=> {
			g.layoutFields.forEach( (lf)=> {
				layout[lf[0]] = lf[1]

				// add the domain
				if (lf[0].startsWith('yaxis')) {
					layout[lf[0]].domain = [
						(g.index-1) * width + gap,
						g.index * width
					]
				}
			})
		})

		// layout = {
		// 	yaxis: {domain: [0, 0.25]},
		// 	yaxis2: {domain: [0.35, 0.6]},
		// 	yaxis3: {domain: [0.7, 0.9]},
		// 	xaxis2: {anchor: 'y2'},
		// 	xaxis3: {anchor: 'y3'},
		// }

		plotly.newPlot(
			graphholder.node(),
			traces,
			layout
		)
	})

}
// --------------------------------------------------------
function makeStackOfGraphs() {

	// clearGraphs()

	// // can only graph when everything is loaded..
	// current.loadProcess.then( ()=> {

	// 	// graph all fields..
	// 	let fields = current.dataset.elements.map( e => e.id )
	// 	// ..unless they specify a defaultgraph field list
	// 	if ('defaultgraph' in current.dataset) {
	// 		console.log('default supplied...')
	// 		fields = current.dataset.defaultgraph
	// 	}
	// 	console.log(fields)

	// 	let graphs = {}

	// 	// turn the field list into a graph list, which
	// 	// might mean several fields get drawn into the same
	// 	// graph (if their axes are the same)
	// 	fields.forEach( (f) => {
	// 		let field = current.dataset.elements.find( c => c.id === f )
	// 		if (!graphs[field.axis]) {
	// 			let latestDate = current.data.time[current.data.time.length - 1]
	// 			graphs[field.axis] = {
	// 				data: [],
	// 				layout: {
	// 					xaxis: {
	// 						range: [
	// 							intervalTools.windBack(latestDate, current.interval),
	// 							latestDate
	// 						],
	// 						rangeslider: { autorange: true },
	// 						type: 'date'
	// 					},
	// 					yaxis: { title: field.axis },
	// 					margin: { t:50, b:50 }
	// 				}
	// 			}
	// 		}
	// 		graphs[field.axis].data.push({
	// 			x: current.data.time,
	// 			y: current.data[f],
	// 			mode: 'lines',
	// 			line: { color: colors.pickColor(field.id) }
	// 		})
	// 	})

	// 	Object.values(graphs).forEach( (g)=> {
	// 		// new div for each graph
	// 		let graphDiv = document.createElement('div')
	// 		graphholder.node().appendChild(graphDiv)
	// 		plotly.newPlot(graphDiv, g.data, g.layout, {displayModeBar: false})
	// 	})

	// })

}
// --------------------------------------------------------
// --------------------------------------------------------
prepareForm()
clearLoading()

let sites = []
const emptyPromise = new Promise((resolve)=> resolve(false))
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
importProcess = dataImporter.getDataInfo().then((siteList) => {
	// succeed
	sites = siteList
	populateSiteSelector(sites)
	clearLoading()
}, (error)=> {
	// fail
	alert('\nThere was a problem!'
		+ '\n\nTried fetching information about datasets but could not find it.'
		+ '\nReload this page to try again.'
	)
	clearLoading()
})




