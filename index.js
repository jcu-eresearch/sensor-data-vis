
const domTools = require('./src/domtools')
const intervalTools = require('./src/intervals')
const dataImporter = require('./src/dataimport')
const colors = require('./src/colors')

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
	// const intSel = document.querySelector('#graph-instance .int-selector')
	// intSel.addEventListener('change', (e)=> {
	// 	intSelected()
	// })
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
	populateDatasetSelector(current.site.datasets)
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

	dataLoadProcess = dataImporter.loadDataset(
		current.site, current.dataset, current.date
	).then((data)=> {
		current.data = data
	})
	current.loadProcess = Promise.all([current.loadProcess, dataLoadProcess])

	makeGraphs()
	// populateIntervalSelector(current.dataset.intervals)
}
// --------------------------------------------------------
// function populateIntervalSelector(intervals) {
// 	const sel = document.querySelector('#graph-instance .int-selector')
// 	sel.innerHTML = ''

// 	// add an option for each interval
// 	intervals.forEach((int)=> {
// 		sel.append(new Option(intervalTools.niceName(int), int))
// 	})

// 	let fieldsetParent = domTools.findParent(sel, 'fieldset')
// 	domTools.removeClass(fieldsetParent, 'disabled')

// 	// select the first one
// 	domTools.selectOption(sel, intervals[0])
// }
// // --------------------------------------------------------
// function intSelected() {
// 	const sel = document.querySelector('#graph-instance .int-selector')

// 	const intid = sel.value
// 	current.interval = intid

// 	makeGraphs()
// }
// --------------------------------------------------------
function clearGraphs() {
	// clear out the graph hholding div
	graphholder.node().innerHTML = ''
}
// --------------------------------------------------------
function makeGraphs() {
	// makeStackOfGraphs()
	makeSubGraphs()
}
// --------------------------------------------------------
function makeSubGraphs() {

	clearGraphs()

	// can only graph when everything is loaded..
	current.loadProcess.then( ()=> {

		const ds = current.dataset // just for typing convenience

		// for now, graph all fields
		const fields = ds.elements.map( e => e.id )

		// get all the subgraphs ready -- if there are
		// fields that share an axis type, they will share
		// a single subgraph.
		sgIndex = 1
		let subgraphs = {}
		let traces = []
		// also, while we're looping through fields,
		// keep track of the latest date we've seen
		let latestDate

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
				sg.layoutFields.push(['yaxis' + sgIndex, { title: field.axis }])
				// sg.layoutFields.push(['title', field.axis])
				subgraphs[field.axis] = sg
				sgIndex += 1
			}

			// now describe the trace for this field
			traces.push({
				x: current.data.time,
				y: current.data[f],
				name: f,
				mode: 'lines',
				line: { color: colors.pickColor(f) },
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

		let layout = {
			legend: {
				orientation: 'h',
				xanchor: 'center',
				tracegroupgap: 20,
				x: 0.5,
				y: 1.1
			},
			xaxis: {
				anchor: 'y',
				rangeselector: {
					y: -0.2,
					x: 1,
					xanchor: 'right',
					buttons: rangeButtons
				},
				rangeslider: {
					autorange: true,
					thickness: 0.05,
					bgcolor: '#def'
				},
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

		console.log('subgraphs', traces)
		console.log('layout', layout)

		plotly.newPlot(
			graphholder.node(),
			traces,
			layout
		)
	})

}
// --------------------------------------------------------
function makeStackOfGraphs() {

	clearGraphs()

	// can only graph when everything is loaded..
	current.loadProcess.then( ()=> {

		// for now, graph all fields
		const fields = current.dataset.elements.map( e => e.id )

		let graphs = {}

		// turn the field list into a graph list, which
		// might mean several fields get drawn into the same
		// graph (if their axes are the same)
		fields.forEach( (f) => {
			let field = current.dataset.elements.find( c => c.id === f )
			if (!graphs[field.axis]) {
				let latestDate = current.data.time[current.data.time.length - 1]
				graphs[field.axis] = {
					data: [],
					layout: {
						xaxis: {
							range: [
								intervalTools.windBack(latestDate, current.interval),
								latestDate
							],
							rangeslider: { autorange: true },
							type: 'date'
						},
						yaxis: { title: field.axis },
						margin: { t:50, b:50 }
					}
				}
			}
			graphs[field.axis].data.push({
				x: current.data.time,
				y: current.data[f],
				mode: 'lines',
				line: { color: colors.pickColor(field.id) }
			})
		})

		Object.values(graphs).forEach( (g)=> {
			// new div for each graph
			let graphDiv = document.createElement('div')
			graphholder.node().appendChild(graphDiv)
			plotly.newPlot(graphDiv, g.data, g.layout, {displayModeBar: false})
		})

	})

}
// --------------------------------------------------------
// --------------------------------------------------------
prepareForm()

let sites = []
const emptyPromise = new Promise((resolve)=> resolve(false))
let current = {
	loadProcess: emptyPromise,

	site: null,
	dataset: null,
	interval: null,
	date: null,

	data: null
}

importProcess = dataImporter.getDataInfo().then((siteList) => {
	sites = siteList
	populateSiteSelector(sites)
})

current.loadProcess = Promise.all([current.loadProcess, importProcess])



