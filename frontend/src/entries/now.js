
const domTools = require('../domtools')
// const intervalTools = require('../intervals')
const dataImporter = require('../dataimport')
// const colors = require('../colors')

// --------------------------------------------------------
function debugMsg(msg, level) {
	level = level || 3
	if (level > 1) {
		console.log('DEBUG' + level + ': ' + msg)
	}
}
// --------------------------------------------------------
function showLoading(message) {
	debugMsg('entering showLoading', 2)
	message = message || 'loading'
	const fs = document.querySelector('#blocks-instance .loading')
	fs.innerHTML = message
	domTools.removeClass(fs, 'clear')
	setTimeout( function() { fs.innerHTML = message }, 1000)
}
// --------------------------------------------------------
function clearLoading() {
	debugMsg('entering clearLoading', 2)
	const fs = document.querySelector('#blocks-instance .loading')
	domTools.addClass(fs, 'clear')
	setTimeout( function() { fs.innerHTML = '' }, 1000)
}
// --------------------------------------------------------
function pickLayout(layouts) {
	const layoutId = domTools.queryVar('layout')
	for (let i=0; i < layouts.length; i++) {
		if (layouts[i].id === layoutId) { return layouts[i] }
	}
	return layouts[0]
}
// --------------------------------------------------------
function loadSiteInfo() {
	debugMsg('entering loadSiteInfo', 2)
	const importProcess = dataImporter.getDataInfo().then(function(siteList) {
		// succeed
		clearLoading()

		// is the nominated site in the site list?
		let site = null
		siteList.forEach(function(s) {
			if (s.id === current.layout.site) { site = s }
		}.bind(this))
		if (!site) {
			alert('\nThere was a problem!\n\nTried fetching information about site "'
				+ current.layout.site
				+ '" but could not find it.\nReload this page to try again.'
			)
			return
		}
		current.site = site

		// is the nominated dataset in that site's dataset?
		let ds = null
		current.site.datasets.forEach(function(d) {
			if (d.id === current.layout.dataset) { ds = d }
		}.bind(this))
		if (!ds) {
			alert('\nThere was a problem!\n\nTried fetching information about dataset "'
				+ current.layout.site + ' :: ' + current.layout.dataset
				+ '" but could not find it.\nReload this page to try again.'
			)
			return
		}
		current.dataset = ds

		// okay now we can load the data we need
		current.date = new Date()
		loadDataAndMakeBlocks()

	}.bind(this), function(error) {
		// fail
		alert('\nThere was a problem!'
			+ '\n\nTried fetching information about datasets but could not find it.'
			+ '\nReload this page to try again.\n\n'
			+ error
		)
		clearLoading()
	}.bind(this))


}
// --------------------------------------------------------
function loadDataAndMakeBlocks() {
	debugMsg('entering loadDataAndMakeBlocks', 2)

	showLoading('loading data')
	let dataLoadProcess = dataImporter.loadDataset(
		current.site, current.dataset, current.date
	).then(function(data) {
		current.data = data
		clearLoading()
		drawBlocks()
	}).catch(function(err) {
		const dataDesc = [
			current.site.id,
			current.dataset.id,
			intervalTools.intervalName(current.date, current.dataset.period)
		].join('::')
		current.data = null
		alert('\nThere was a problem!\n\n'
			+ 'Data for ' + dataDesc + ' is not available.'
		)
		clearLoading()
	})

	current.loadProcess = dataLoadProcess
}
// --------------------------------------------------------
function makeOneBlock(blockInfo) {

	let b = document.createElement('div')
	b.className = 'block'

	let bi = document.createElement('div')
	bi.className = 'blockinner'
	b.appendChild(bi)

	let pre = document.createElement('div')
	pre.className = 'preamble'
	bi.appendChild(pre)

	let val = document.createElement('div')
	val.className = 'value'
	bi.appendChild(val)

	let units = document.createElement('div')
	units.className = 'units'
	bi.appendChild(units)

	let post = document.createElement('div')
	post.className = 'postamble'
	bi.appendChild(post)

	// get the value into there
	val.innerHTML = 'XX'
	let data = current.data[blockInfo.element]
	for (let i = data.length-1; i >= 0; i--) {
		if (data[i]) {
			val.innerHTML = data[i]
			break
		}
	}
	pre.innerHTML = blockInfo.preamble || ''
	units.innerHTML = blockInfo.units || ''
	post.innerHTML = blockInfo.postamble || ''

	if (Math.random() < 0.9) {
		val.innerHTML = '--'
		units.innerHTML = 'no recent reading'
	}

	b.style.color = blockInfo.textcolor || '#000'

	let backgrounds = []
	let bgPositions = []
	let bgSizes = []
	if (blockInfo.image) {
		backgrounds.push('url(' + blockInfo.image + ')')
		bgPositions.push('25% 50%')
		bgSizes.push('auto 80%')
	}
	if (blockInfo.background) {
		if (typeof blockInfo.background === 'string') {
			b.style.backgroundColor = blockInfo.background
		} else {
			backgrounds.push(
				'linear-gradient(to bottom, '
				+ blockInfo.background.join(', ') + ')'
			)
			bgPositions.push('center')
			bgSizes.push('auto')
		}
	}
	if (backgrounds.length) {
		b.style.backgroundImage = backgrounds.join(', ')
		b.style.backgroundPosition = bgPositions.join(', ')
		b.style.backgroundRepeat = 'no-repeat'
		b.style.backgroundSize = bgSizes.join(', ')
	}

	return b
}
// --------------------------------------------------------
function drawBlocks() {
	debugMsg('entering drawBlocks', 2)

	current.layout.display.forEach( function(block) {
		console.log(block.element)
		let blockElem = makeOneBlock(block)
		document.querySelector('#blocksholder').appendChild(blockElem)

	}.bind(this))

}
// --------------------------------------------------------
// --------------------------------------------------------
clearLoading()

let sites = []
const emptyPromise = new Promise(function(resolve) { resolve(false) } )
let current = {
	loadProcess: emptyPromise,

	layout: null,

	site: null,
	dataset: null,
	interval: null,
	date: null,
	graph: [],

	data: null
}

showLoading('reading layout instructions')
const importProcess = dataImporter.getNowInfo().then(function(layouts) {
	// succeed
	current.layout = pickLayout(layouts)
	clearLoading()
	loadSiteInfo()
}.bind(this), function(error) {
	// fail
	alert('\nThere was a problem!'
		+ '\n\nTried fetching layout information but could not find it.'
		+ '\nReload this page to try again.\n\n'
		+ error
	)
	clearLoading()
}.bind(this))




