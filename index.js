
const domtools = require('./src/domtools')
const intervaltools = require('./src/intervals')
const data = require('./src/dataimport')

const Plotly = require('plotly.js')

const d3 = Plotly.d3

let graphholder = d3.select('#graphholder')
	.style({height: '500px'})

Plotly.plot(graphholder.node(), [{ x: [0, 1], y: [0, 1] }])

window.onresize = () => Plotly.Plots.resize(graphholder.node())

// --------------------------------------------------------
function prepareForm() {
	// handle dataset change
	const datasetSel = document.querySelector('#graph-instance .dataset-selector')
	datasetSel.addEventListener('change', (e)=> {
		datasetSelected()
	})

	// handle resolution change
	const resSel = document.querySelector('#graph-instance .res-selector')
	resSel.addEventListener('change', (e)=> {
		resSelected()
	})
}
// --------------------------------------------------------
function populateDatasetSelector(datasets) {
	const sel = document.querySelector('#graph-instance .dataset-selector')

	// empty the selector
	sel.innerHTML = ''

	// add a "nothing selected" option that is disabled
	sel.append(new Option('select a dataset...', '', true))
	sel.options.item(0).disabled = true
	// add an option for each dataset
	datasets.forEach((ds)=> {
		sel.append(new Option(ds.name, ds.id))
	})

	// un-disable the selector's parent fieldset
	let fieldsetParent = domtools.findParent(sel, 'fieldset')
	domtools.removeClass(fieldsetParent, 'disabled')
}
// --------------------------------------------------------
function datasetSelected() {
	const sel = document.querySelector('#graph-instance .dataset-selector')
	const dsid = sel.value
	current.dataset = datasets.filter((ds)=> ds.id === dsid)[0]
	populateResolutionSelector(current.dataset.sets)
}
// --------------------------------------------------------
function populateResolutionSelector(resolutions) {
	const sel = document.querySelector('#graph-instance .res-selector')
	sel.innerHTML = ''
	sel.append(new Option('select a resolution...', '', true))
	sel.options.item(0).disabled = true
	// add an option for each resolution
	resolutions.forEach((res)=> {
		sel.append(new Option(res.name, res.id))
	})
	let fieldsetParent = domtools.findParent(sel, 'fieldset')
	domtools.removeClass(fieldsetParent, 'disabled')
}
// --------------------------------------------------------
function resSelected() {
	const sel = document.querySelector('#graph-instance .res-selector')
	const resid = sel.value
	current.resolution = current.dataset.sets.filter((set)=> set.id === resid)[0]
	populateIntervalSelector(current.resolution.intervals)
}
// --------------------------------------------------------
function populateIntervalSelector(intervals) {
	console.log(intervals)
	const sel = document.querySelector('#graph-instance .int-selector')
	sel.innerHTML = ''
	sel.append(new Option('select an interval...', '', true))
	sel.options.item(0).disabled = true
	// add an option for each interval
	intervals.forEach((int)=> {
		sel.append(new Option(intervaltools.niceName(int), int))
	})
	let fieldsetParent = domtools.findParent(sel, 'fieldset')
	domtools.removeClass(fieldsetParent, 'disabled')
}
// --------------------------------------------------------
function resSelected() {
	const sel = document.querySelector('#graph-instance .res-selector')
	const resid = sel.value
	current.resolution = current.dataset.sets.filter((set)=> set.id === resid)[0]
	populateIntervalSelector(current.resolution.intervals)
}
// --------------------------------------------------------
// --------------------------------------------------------
prepareForm()

let datasets = []
let current = {
	dataset: null,
	resolution: null,
	interval: null
}

data.getDatasetInfo().then((sets) => {
	datasets = sets
	populateDatasetSelector(datasets)
})





