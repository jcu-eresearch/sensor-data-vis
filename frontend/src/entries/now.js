
const domTools = require('../domtools')
const intervalTools = require('../intervals')
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

		// set up the data refresh
		const refresh = current.layout.refresh || '5min'
		console.log(intervalTools.secondsIn(refresh) * 1000)

		setTimeout(
			function() { loadDataAndMakeBlocks() }.bind(this),
			intervalTools.secondsIn(refresh) * 1000
		)

	}).catch(function(err) {
		const dataDesc = [
			current.site.id,
			current.dataset.id,
			intervalTools.intervalName(current.date, current.dataset.period)
		].join(' :: ')
		current.data = null
		alert('\nThere was a problem!\n\n'
			+ 'Data for ' + dataDesc + ' is not available.\n\n' + err
		)
		clearLoading()
	})

	current.loadProcess = dataLoadProcess
}
// --------------------------------------------------------
/** return a new div with the supplied className.
    If parent is supplied, the div will be appended
    to that parent.
*/
function makeDiv(className, parent) {
	const elem = document.createElement('div')
	elem.className = className
	if (parent) {
		parent.appendChild(elem)
	}
	return elem
}
// --------------------------------------------------------
function makeOneBlock(blockInfo, ageLimit) {

	ageLimit = ageLimit || '1y'
	console.log('ageLimit is ' + ageLimit)

	let b = makeDiv('block')
	let bi = makeDiv('blockinner', b)
	let pre = makeDiv('preamble', bi)
	let val = makeDiv('value', bi)
	let units = makeDiv('units', bi)
	let post = makeDiv('postamble', bi)

	pre.innerHTML = blockInfo.preamble || ''
	units.innerHTML = blockInfo.units || ''
	post.innerHTML = blockInfo.postamble || ''

	// get the value into val
	val.innerHTML = '--'
	let data = current.data[blockInfo.element]
	let tooOld = intervalTools.windBack(new Date(), ageLimit)
	for (let i = data.length-1; i >= 0; i--) {
		// bail out of we're too old now
		if (intervalTools.isAfter(tooOld, current.data.time[i])) {
			// the latest data is too old
			val.innerHTML = '--'
			units.innerHTML = 'no recent reading'
			break
		}
		// if this is valid data, get it and bail out
		if (data[i]) {
			val.innerHTML = data[i]
			break
		}
	}

	if (blockInfo.image) {
		let img = document.createElement('img')
		img.src = blockInfo.image
		bi.insertBefore(img, pre)
	}

	b.style.color = blockInfo.textcolor || '#000'

	let backgrounds = []
	let bgPositions = []
	let bgSizes = []

	if (blockInfo.bgimage) {
		backgrounds.push('url(' + blockInfo.bgimage + ')')
		if (blockInfo.bgposition) {
			bgPositions.push(blockInfo.bgposition)
		} else {
			bgPositions.push('center')
		}
		bgSizes.push('auto')
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

	if (blockInfo.bottomedge) {
		// make a div to draw the bottom edge
		let edge = makeDiv('bottomedge ' + blockInfo.bottomedge, bi)

		// work out the colour at the top of the edge
		let topColor = '#fff'
		if (blockInfo.background && typeof blockInfo.background === 'string') {
			topColor = blockInfo.background
		} else {
			topColor = blockInfo.background[blockInfo.background.length - 1]
		}

		// do the special handling
		if (blockInfo.bottomedge === 'waves') {
			edge.style.backgroundRepeat = "repeat"
			edge.style.backgroundSize = "20px 20px"
			edge.style.backgroundImage = "radial-gradient(circle at 10px -6px, " + topColor + " 12px, transparent 13px)"
		}

		if (blockInfo.bottomedge === 'fade') {
			edge.style.backgroundImage = "linear-gradient(to bottom, " + topColor + ", transparent)"
		}
	}

	return b
}
// --------------------------------------------------------
function drawBlocks() {
	debugMsg('entering drawBlocks', 2)

	const holder = document.querySelector('#blocksholder')
	holder.innerHTML = ''
	current.layout.display.forEach( function(block) {
		console.log(block.element)
		let blockElem = makeOneBlock(block, current.layout.agelimit)
		holder.appendChild(blockElem)
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




